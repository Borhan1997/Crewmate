"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  type BotInput,
  botInsertSchema,
  bots,
  chatMembers,
  chats,
} from "@/db/schema";

export async function createBot(input: BotInput) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  const data = botInsertSchema.parse(input);

  // One transaction: the bot, its direct chat and the membership are created together or not at all.
  const bot = await db.transaction(async (tx) => {
    const [bot] = await tx
      .insert(bots)
      .values({ ...data, instructions: data.instructions || null, userId })
      .returning();

    const [chat] = await tx
      .insert(chats)
      .values({ userId, kind: "direct" })
      .returning({ id: chats.id });

    await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id });

    return bot;
  });

  revalidatePath("/");
  return bot;
}
