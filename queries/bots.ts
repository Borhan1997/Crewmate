import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";

export type SidebarChat = {
  id: string;
  kind: "direct" | "group";
  name: string | null;
  /** Members in join order. A direct chat has exactly one. */
  bots: { id: string; name: string; avatar: string }[];
  lastMessagePreview: string | null;
  lastMessageAt: Date;
};

/** The signed-in user's chats, newest activity first. */
export async function getSidebarChats(): Promise<SidebarChat[]> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return [];

  const rows = await db
    .select({
      id: chats.id,
      kind: chats.kind,
      name: chats.name,
      lastMessagePreview: chats.lastMessagePreview,
      lastMessageAt: chats.lastMessageAt,
      bot: { id: bots.id, name: bots.name, avatar: bots.avatar },
    })
    .from(chats)
    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .innerJoin(bots, and(eq(bots.id, chatMembers.botId), eq(bots.userId, userId)))
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.lastMessageAt), asc(chatMembers.joinedAt), asc(chatMembers.botId));

  // A chat has one row per member; fold them into one chat with its bots.
  const byId = new Map<string, SidebarChat>();
  for (const { bot, ...row } of rows) {
    const chat = byId.get(row.id);
    if (chat) chat.bots.push(bot);
    else byId.set(row.id, { ...row, bots: [bot] });
  }
  return [...byId.values()];
}

/** The signed-in user's bots, for picking group members. */
export async function getBots() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return [];

  return db
    .select({ id: bots.id, name: bots.name, avatar: bots.avatar })
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(asc(bots.createdAt));
}
