import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  dialect: "postgresql",
  // Direct (non-pooled) connection for schema changes.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
});
