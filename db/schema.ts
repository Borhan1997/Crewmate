import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const todo = pgTable("todo", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todoInsertSchema = createInsertSchema(todo, {
  title: (schema) =>
    schema
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
}).omit({
  id: true,
  userId: true,
  completed: true,
  createdAt: true,
});

export type TodoInsert = z.infer<typeof todoInsertSchema>;
