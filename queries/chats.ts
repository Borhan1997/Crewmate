import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";

export type Chat = {
  id: string;
  bot: {
    id: string;
    name: string;
    avatar: string;
    job: string;
    instructions: string | null;
  };
};

/** A chat by id, only if it belongs to the signed-in user. Represented by its first bot for now. */
export async function getChat(chatId: string): Promise<Chat | null> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return null;

  const [row] = await db
    .select({
      id: chats.id,
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
    .orderBy(asc(chatMembers.joinedAt))
    .limit(1);

  return row ?? null;
}
