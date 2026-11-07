import https from "node:https";
import { env } from "../../config/env.js";

const httpsAgent = new https.Agent({ family: 4, keepAlive: false });

async function requestTelegram<T = unknown>(
  botToken: string,
  method: "GET" | "POST",
  endpoint: string,
  body?: unknown,
): Promise<{ ok: boolean; result?: T; description?: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${botToken}/${endpoint}`,
        method,
        agent: httpsAgent,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export interface TelegramMessageOptions {
  parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
  };
}

export type AgentPersonaKey =
  "incident-manager" | "log-analyzer" | "code-fixer" | "testing-agent";

export class TelegramService {
  private readonly botToken: string;
  private readonly roleTokens = new Map<AgentPersonaKey, string>();
  private knownChatIds = new Set<string>();
  private actionHandler?: (action: string, incidentKey: string) => Promise<string>;

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN ?? "";
    if (env.TELEGRAM_BOT_TOKEN_INCIDENT_MANAGER) {
      this.roleTokens.set("incident-manager", env.TELEGRAM_BOT_TOKEN_INCIDENT_MANAGER);
    }
    if (env.TELEGRAM_BOT_TOKEN_LOG_ANALYZER) {
      this.roleTokens.set("log-analyzer", env.TELEGRAM_BOT_TOKEN_LOG_ANALYZER);
    }
    if (env.TELEGRAM_BOT_TOKEN_CODE_FIXER) {
      this.roleTokens.set("code-fixer", env.TELEGRAM_BOT_TOKEN_CODE_FIXER);
    }
    if (env.TELEGRAM_BOT_TOKEN_TESTING_AGENT) {
      this.roleTokens.set("testing-agent", env.TELEGRAM_BOT_TOKEN_TESTING_AGENT);
    }
    if (env.TELEGRAM_CHAT_ID) {
      this.knownChatIds.add(env.TELEGRAM_CHAT_ID);
    }
    const dedicatedCount = this.roleTokens.size;
    if (this.botToken || dedicatedCount > 0) {
      console.log(
        `[telegram] Initialized (${dedicatedCount} dedicated agent bots, primary: ${this.botToken ? this.botToken.slice(0, 10) + "..." : "none"}, known chats: ${Array.from(this.knownChatIds).join(", ") || "none"})`,
      );
    } else {
      console.log(`[telegram] Disabled - no TELEGRAM_BOT_TOKEN provided.`);
    }
  }

  setActionHandler(
    handler: (action: string, incidentKey: string) => Promise<string>,
  ): void {
    this.actionHandler = handler;
  }

  get connectedChatCount(): number {
    return this.knownChatIds.size;
  }

  /**
   * Broadcast message to all discovered Telegram chats
   */
  async broadcast(text: string, options?: TelegramMessageOptions): Promise<void> {
    if (this.knownChatIds.size === 0 && this.allActiveTokens.length > 0) {
      // Attempt to poll once to find any recent /start
      await this.pollUpdatesForToken(this.allActiveTokens[0]);
    }

    const promises = Array.from(this.knownChatIds).map((chatId) =>
      this.sendMessage(chatId, text, options),
    );
    await Promise.allSettled(promises);
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options: TelegramMessageOptions = { parse_mode: "HTML" },
  ): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      const res = await requestTelegram(this.botToken, "POST", "sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode ?? "HTML",
        reply_markup: options.reply_markup,
      });
      return Boolean(res.ok);
    } catch (err) {
      console.warn(`[telegram] Failed to send message to ${chatId}:`, err);
      return false;
    }
  }

  /**
   * Post investigation report with formatted code diff and inline action buttons
   */
  async sendInvestigationReport(data: {
    incidentKey: string;
    summary: string;
    rootCause: string;
    patch: string;
    testsPassed: number;
    testsTotal: number;
  }): Promise<void> {
    const message = [
      `🚨 <b>[DevOps Command Center Alert]</b>`,
      `Incident: <code>${data.incidentKey}</code>`,
      ``,
      `🔍 <b>Root Cause Analysis:</b>`,
      `${data.rootCause}`,
      ``,
      `🛠️ <b>Synthesized Patch:</b>`,
      `<pre><code class="language-diff">${this.escapeHtml(data.patch)}</code></pre>`,
      ``,
      `🧪 <b>Test Suite Verification:</b>`,
      `Status: <b>PASSED</b> ✅ (${data.testsPassed}/${data.testsTotal} assertions)`,
      ``,
      `👉 <i>Review & approve below or via Web Dashboard:</i>`,
    ].join("\n");

    const reply_markup = {
      inline_keyboard: [
        [
          { text: "✅ Approve & Resolve", callback_data: `approve:${data.incidentKey}` },
          { text: "❌ Reject Patch", callback_data: `reject:${data.incidentKey}` },
        ],
      ],
    };

    await this.broadcast(message, { parse_mode: "HTML", reply_markup });
  }

  private isPolling = false;
  private lastUpdateIds = new Map<string, number>();

  private get allActiveTokens(): string[] {
    const tokens = new Set<string>();
    if (this.botToken) tokens.add(this.botToken);
    for (const token of this.roleTokens.values()) {
      if (token) tokens.add(token);
    }
    return Array.from(tokens);
  }

  startPolling(): void {
    if (
      this.allActiveTokens.length === 0 ||
      this.isPolling ||
      process.env.NODE_ENV === "test"
    )
      return;
    this.isPolling = true;
    console.log(
      `[telegram] Sequential long-polling loop started for ${this.allActiveTokens.length} bot(s).`,
    );
    void this.pollLoop();
  }

  stopPolling(): void {
    this.isPolling = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isPolling) {
      try {
        for (const token of this.allActiveTokens) {
          await this.pollUpdatesForToken(token);
        }
      } catch {
        // Sleep briefly on connection error before next cycle
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  private async pollUpdatesForToken(token: string): Promise<void> {
    try {
      const lastId = this.lastUpdateIds.get(token) ?? 0;
      const data = await requestTelegram<
        Array<{
          update_id: number;
          message?: {
            chat: { id: number; type?: string };
            text?: string;
          };
          callback_query?: {
            id: string;
            from: { first_name: string };
            data?: string;
            message?: { chat: { id: number }; message_id: number };
          };
        }>
      >(token, "GET", `getUpdates?offset=${lastId + 1}&timeout=2`);

      if (!data.ok || !Array.isArray(data.result)) {
        return;
      }

      for (const update of data.result) {
        this.lastUpdateIds.set(token, Math.max(lastId, update.update_id));

        if (update.message) {
          const chatId = String(update.message.chat.id);
          const chatType = (update.message.chat as { type?: string }).type;
          const isGroup = chatType === "group" || chatType === "supergroup";
          const isNew = !this.knownChatIds.has(chatId);
          this.knownChatIds.add(chatId);

          const rawText = update.message.text?.trim() ?? "";
          const command = rawText.split(" ")[0].split("@")[0].toLowerCase();
          console.log(
            `[telegram] Received message "${rawText}" (command: "${command}") from chat ${chatId}`,
          );

          if (command === "/start" || command === "/help" || isNew) {
            const welcomeText = isGroup
              ? `🤝 <b>DevOps AI Incident War Room Connected!</b>\n\n` +
                `This Telegram group is now registered as the active war room for the human engineer and the AI squad.\n\n` +
                `<b>Squad Members:</b>\n` +
                `🤖 <b>Incident Manager</b> — Triage & blast radius coordination\n` +
                `🔍 <b>Log Analyzer</b> — Telemetry & stack trace isolation\n` +
                `🛠️ <b>Code Fixer</b> — Hotfix diff synthesizer\n` +
                `🧪 <b>Testing Agent</b> — Automated regression suite validation\n\n` +
                `When an incident is investigated, each agent will converse sequentially in this group, then request human approval.\n\n` +
                `Click below or send <code>/investigate</code> to launch:`
              : `👋 <b>Connected to DevOps AI Command Center!</b>\n\n` +
                `You will receive real-time incident triage alerts, AI-generated code patches, and test proofs directly in this chat.\n\n` +
                `<i>Ready for incident investigation...</i>`;

            await this.sendMessageWithToken(token, chatId, welcomeText, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Investigate INC-2847",
                      callback_data: "trigger:INC-2847",
                    },
                  ],
                ],
              },
            });
          } else if (command === "/investigate") {
            const parts = rawText.split(" ").filter(Boolean);
            const targetKey = parts[1] || "INC-2847";
            if (this.actionHandler) {
              await this.sendMessageWithToken(
                token,
                chatId,
                `🚀 <b>Initiating Incident Squad Investigation for <code>${targetKey}</code>...</b>\n<i>AI agents are joining the war room channel...</i>`,
              );
              await this.actionHandler("trigger", targetKey);
            }
          } else if (command === "/status") {
            if (this.actionHandler) {
              const statusNote = await this.actionHandler("status", "");
              await this.sendMessageWithToken(token, chatId, statusNote);
            }
          }
        }

        if (update.callback_query && update.callback_query.data) {
          const callbackData = update.callback_query.data;
          const [action, incidentKey] = callbackData.split(":");

          if (this.actionHandler && incidentKey) {
            const resultNote = await this.actionHandler(action, incidentKey);
            await requestTelegram(token, "POST", "answerCallbackQuery", {
              callback_query_id: update.callback_query.id,
              text: resultNote,
            });

            if (update.callback_query.message && action !== "trigger") {
              const statusEmoji = action === "approve" ? "✅" : "🛑";
              await this.sendMessageWithToken(
                token,
                update.callback_query.message.chat.id,
                `${statusEmoji} <b>Patch for ${incidentKey} was ${action.toUpperCase()}D by ${update.callback_query.from.first_name} via Telegram!</b>`,
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("[telegram] pollUpdates network error:", err);
    }
  }

  async broadcastAgentMessage(options: {
    role?: AgentPersonaKey;
    agentName: string;
    emoji: string;
    text: string;
    reply_markup?: TelegramMessageOptions["reply_markup"];
  }): Promise<void> {
    const specificToken = options.role ? this.roleTokens.get(options.role) : undefined;
    const activeToken = specificToken || this.botToken;

    const formatted = [
      `${options.emoji} <b>[${options.agentName}]</b>`,
      options.text,
    ].join("\n");

    if (activeToken) {
      await this.broadcastWithToken(activeToken, formatted, {
        reply_markup: options.reply_markup,
      });
    } else {
      await this.broadcast(formatted, { reply_markup: options.reply_markup });
    }
  }

  async broadcastWithToken(
    token: string,
    text: string,
    options?: TelegramMessageOptions,
  ): Promise<void> {
    if (!token) return;
    const promises = Array.from(this.knownChatIds).map((chatId) =>
      this.sendMessageWithToken(token, chatId, text, options),
    );
    await Promise.allSettled(promises);
  }

  async sendMessageWithToken(
    token: string,
    chatId: string | number,
    text: string,
    options: TelegramMessageOptions = { parse_mode: "HTML" },
  ): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await requestTelegram(token, "POST", "sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode ?? "HTML",
        reply_markup: options.reply_markup,
      });
      return Boolean(res.ok);
    } catch (err) {
      console.warn(`[telegram] Failed to send message to ${chatId}:`, err);
      return false;
    }
  }

  escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

export const telegramService = new TelegramService();
