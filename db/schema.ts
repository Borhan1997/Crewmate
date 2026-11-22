import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
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

export const chatKind = pgEnum("chat_kind", ["direct", "group"]);

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    kind: chatKind("kind").notNull().default("direct"),
    name: text("name"),
    lastMessagePreview: text("last_message_preview"),
    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("chats_user_id_idx").on(table.userId)],
);

export const chatMembers = pgTable(
  "chat_members",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    botId: text("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.botId] }),
    index("chat_members_bot_id_idx").on(table.botId),
  ],
);

export const botsRelations = relations(bots, ({ many }) => ({
  memberships: many(chatMembers),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, { fields: [chatMembers.chatId], references: [chats.id] }),
  bot: one(bots, { fields: [chatMembers.botId], references: [bots.id] }),
}));

export const botInsertSchema =createInsertSchema(bots, {
  name: (schema) =>
    schema.trim().min(1, "Give your bot a name").max(40, "Keep it under 40 characters"),
  job: (schema) =>
    schema.trim().min(1, "What does this bot do?").max(80, "Keep it under 80 characters"),
  instructions: (schema) =>
    schema.trim().max(2000, "Keep it under 2000 characters").nullish(),
}).omit({ id: true, userId: true, sandboxId: true, createdAt: true });

export type BotInput = z.infer<typeof botInsertSchema>;

export const groupChatInsertSchema = createInsertSchema(chats)
  .omit({
    id: true,
    userId: true,
    kind: true,
    lastMessagePreview: true,
    lastMessageAt: true,
    createdAt: true,
  })
  .extend({
    // A group is always named, unlike the nullable column.
    name: z.string().trim().min(1, "Name the group").max(40, "Keep it under 40 characters"),
    botIds: z.array(z.string()).min(2, "Pick at least two bots"),
  });

export type GroupChatInput = z.infer<typeof groupChatInsertSchema>;
