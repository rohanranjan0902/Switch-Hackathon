import dns from "node:dns";
import dotenv from "dotenv";
import { z } from "zod";

// Ensure IPv4 lookup precedence in WSL environments to prevent Node fetch ETIMEDOUT
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
dotenv.config({ path: "../.env" });

export const isRunningTests =
  process.env.NODE_ENV === "test" ||
  process.env.npm_lifecycle_event === "test" ||
  process.argv.some((arg) => arg.includes("test")) ||
  process.execArgv.some((arg) => arg.includes("test"));

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default(isRunningTests ? "test" : "development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  SWITCH_ENABLED: isRunningTests ? z.any().transform(() => false) : z.stringbool().default(false),
  SWITCH_BASE_URL: z.string().optional(),
  SWITCH_API_KEY: z.string().optional(),
  SWITCH_AGENT_ID: z.string().optional(),
  SWITCH_ROOM_ID: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN_INCIDENT_MANAGER: z.string().optional(),
  TELEGRAM_BOT_TOKEN_LOG_ANALYZER: z.string().optional(),
  TELEGRAM_BOT_TOKEN_CODE_FIXER: z.string().optional(),
  TELEGRAM_BOT_TOKEN_TESTING_AGENT: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  GITHUB_ENABLED: z.stringbool().default(false),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPOSITORY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
