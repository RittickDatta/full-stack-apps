
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  CLIENT_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:5173"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment configuration:",
    z.treeifyError(parsedEnv.error),
  );

  process.exit(1);
}

export const env = parsedEnv.data;
