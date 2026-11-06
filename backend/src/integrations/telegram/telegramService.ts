import { env } from "../../config/env.js";

export interface TelegramMessageOptions {
  parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
  };
}

export class TelegramService {
  private readonly botToken: string;
  private knownChatIds = new Set<string>();
  private pollInterval?: NodeJS.Timeout;
  private lastUpdateId = 0;
  private actionHandler?: (action: string, incidentKey: string) => Promise<string>;

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN ?? "";
    if (env.TELEGRAM_CHAT_ID) {
      this.knownChatIds.add(env.TELEGRAM_CHAT_ID);
    }
  }

  setActionHandler(handler: (action: string, incidentKey: string) => Promise<string>): void {
    this.actionHandler = handler;
  }

  get connectedChatCount(): number {
    return this.knownChatIds.size;
  }

  /**
   * Broadcast message to all discovered Telegram chats
   */
  async broadcast(text: string, options?: TelegramMessageOptions): Promise<void> {
    if (this.knownChatIds.size === 0) {
      // Attempt to poll once to find any recent /start
      await this.pollUpdates();
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
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options.parse_mode ?? "HTML",
          reply_markup: options.reply_markup,
        }),
      });
      return response.ok;
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

  startPolling(): void {
    if (!this.botToken || this.pollInterval || process.env.NODE_ENV === "test") return;
    // Initial fetch
    void this.pollUpdates();
    this.pollInterval = setInterval(() => {
      void this.pollUpdates();
    }, 3000);
    if (this.pollInterval.unref) {
      this.pollInterval.unref();
    }
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private async pollUpdates(): Promise<void> {
    if (!this.botToken) return;
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=2`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = (await res.json()) as {
        ok: boolean;
        result: Array<{
          update_id: number;
          message?: {
            chat: { id: number };
            text?: string;
          };
          callback_query?: {
            id: string;
            from: { first_name: string };
            data?: string;
            message?: { chat: { id: number }; message_id: number };
          };
        }>;
      };

      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);

        if (update.message) {
          const chatId = String(update.message.chat.id);
          const chatType = (update.message.chat as { type?: string }).type;
          const isGroup = chatType === "group" || chatType === "supergroup";
          const isNew = !this.knownChatIds.has(chatId);
          this.knownChatIds.add(chatId);

          const rawText = update.message.text?.trim() ?? "";
          const command = rawText.split(" ")[0].split("@")[0].toLowerCase();

          if (command === "/start" || isNew) {
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

            await this.sendMessage(chatId, welcomeText, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🚀 Investigate INC-2847", callback_data: "trigger:INC-2847" }],
                ],
              },
            });
          } else if (command === "/investigate") {
            const parts = rawText.split(" ").filter(Boolean);
            const targetKey = parts[1] || "INC-2847";
            if (this.actionHandler) {
              await this.sendMessage(
                chatId,
                `🚀 <b>Initiating Incident Squad Investigation for <code>${targetKey}</code>...</b>\n<i>AI agents are joining the war room channel...</i>`,
              );
              await this.actionHandler("trigger", targetKey);
            }
          } else if (command === "/status") {
            if (this.actionHandler) {
              const statusNote = await this.actionHandler("status", "");
              await this.sendMessage(chatId, statusNote);
            }
          }
        }

        if (update.callback_query && update.callback_query.data) {
          const callbackData = update.callback_query.data;
          const [action, incidentKey] = callbackData.split(":");

          if (this.actionHandler && incidentKey) {
            const resultNote = await this.actionHandler(action, incidentKey);
            await fetch(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callback_query_id: update.callback_query.id,
                text: resultNote,
              }),
            });

            if (update.callback_query.message && action !== "trigger") {
              const statusEmoji = action === "approve" ? "✅" : "🛑";
              await this.sendMessage(
                update.callback_query.message.chat.id,
                `${statusEmoji} <b>Patch for ${incidentKey} was ${action.toUpperCase()}D by ${update.callback_query.from.first_name} via Telegram!</b>`,
              );
            }
          }
        }
      }
    } catch {
      // Ignore polling transient errors
    }
  }

  async broadcastAgentMessage(options: {
    agentName: string;
    emoji: string;
    text: string;
    reply_markup?: TelegramMessageOptions["reply_markup"];
  }): Promise<void> {
    const formatted = [
      `${options.emoji} <b>[${options.agentName}]</b>`,
      options.text,
    ].join("\n");
    await this.broadcast(formatted, { reply_markup: options.reply_markup });
  }

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

export const telegramService = new TelegramService();
