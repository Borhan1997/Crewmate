import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";

export type ChatBot = {
  id: string;
  name: string;
  avatar: string;
  job: string;
  instructions: string | null;
};

export type Chat = {
  id: string;
  kind: "direct" | "group";
  name: string | null;
  /** Members in join order. A direct chat has exactly one. */
  bots: ChatBot[];
};

/** A chat by id, only if it belongs to the signed-in user. */
export async function getChat(chatId: string): Promise<Chat | null> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return null;

  const rows = await db
    .select({
      id: chats.id,
      kind: chats.kind,
      name: chats.name,
      bot: {
        id: bots.id,
        name: bots.name,
        avatar: bots.avatar,
        job: bots.job,
        instructions: bots.instructions,
      },
    })
    .from(chats)
    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .innerJoin(bots, and(eq(bots.id, chatMembers.botId), eq(bots.userId, userId)))
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .orderBy(asc(chatMembers.joinedAt), asc(chatMembers.botId));

  if (rows.length === 0) return null;
  const { id, kind, name } = rows[0];
  return { id, kind, name, bots: rows.map((row) => row.bot) };
}
