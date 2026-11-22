import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";

export type SidebarChat = {
  id: string;
  bot: { id: string; name: string; avatar: string };
  lastMessagePreview: string | null;
  lastMessageAt: Date;
};

/** The signed-in user's chats, newest activity first. Each chat is represented by its first bot. */
export async function getSidebarChats(): Promise<SidebarChat[]> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return [];

  const rows = await db
    .select({
      id: chats.id,
      lastMessagePreview: chats.lastMessagePreview,
      lastMessageAt: chats.lastMessageAt,
      bot: { id: bots.id, name: bots.name, avatar: bots.avatar },
    })
    .from(chats)
    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .innerJoin(bots, and(eq(bots.id, chatMembers.botId), eq(bots.userId, userId)))
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.lastMessageAt), asc(chatMembers.joinedAt));

  // A chat has one row per member; keep the first (earliest joined) bot.
  const seen = new Set<string>();
  return rows.filter((row) => !seen.has(row.id) && seen.add(row.id));
}
