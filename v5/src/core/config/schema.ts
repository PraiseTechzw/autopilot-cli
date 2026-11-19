import { z } from "zod";

export const CONFIG_VERSION = 5 as const;

export const AI_PROVIDERS = [
  "none",
  "openrouter",
  "openai",
  "gemini",
  "groq",
] as const;

export const ConfigSchema = z
  .object({
    version: z.literal(CONFIG_VERSION),
    watch: z
      .object({
        debounceMs: z.number().int().min(100).max(60_000).default(1_000),
        maxWaitMs: z.number().int().min(1_000).max(600_000).default(30_000),
      })
      .strict()
      .prefault({}),
    git: z
      .object({
        autoPush: z.boolean().default(false),
        remote: z.string().min(1).max(200).default("origin"),
        protectedBranches: z
          .array(z.string().min(1).max(200))
          .default(["main", "master"]),
      })
      .strict()
      .prefault({}),
    safety: z
      .object({
        secrets: z.literal("block").default("block"),
        maxFileSizeMb: z.number().positive().max(100).default(10),
        scanStagedBlobsOnly: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    ai: z
      .object({
        enabled: z.boolean().default(false),
        provider: z.enum(AI_PROVIDERS).default("none"),
      })
      .strict()
      .prefault({}),
    privacy: z
      .object({
        leaderboard: z.boolean().default(false),
        telemetry: z.boolean().default(false),
        updateCheck: z.boolean().default(false),
      })
      .strict()
      .prefault({}),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.ai.enabled && config.ai.provider === "none") {
      context.addIssue({
        code: "custom",
        path: ["ai", "provider"],
        message: "ai.provider is required when ai.enabled is true",
      });
    }

  });

export type Config = z.infer<typeof ConfigSchema>;

export function defaultConfig(): Config {
  return ConfigSchema.parse({ version: CONFIG_VERSION });
}
