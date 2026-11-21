import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";

export const bots = pgTable(
  "bots",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text("job").notNull(),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)],
);

export const botInsertSchema = createInsertSchema(bots, {
  name: (schema) =>
    schema.trim().min(1, "Give your bot a name").max(40, "Keep it under 40 characters"),
  job: (schema) =>
    schema.trim().min(1, "What does this bot do?").max(80, "Keep it under 80 characters"),
  instructions: (schema) =>
    schema.trim().max(2000, "Keep it under 2000 characters").nullish(),
}).omit({ id: true, userId: true, sandboxId: true, createdAt: true });

export type BotInput = z.infer<typeof botInsertSchema>;
