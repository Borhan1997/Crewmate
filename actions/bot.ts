"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { createSandbox, deleteSandbox } from "@/lib/daytona";
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
  const botId = nanoid();
  const sandboxId = await createSandbox(botId);

  let created;
  try {
    created = await db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({
          ...data,
          id: botId,
          instructions: data.instructions || null,
          sandboxId,
          userId,
        })
        .returning();

      const [chat] = await tx
        .insert(chats)
        .values({ userId, kind: "direct" })
        .returning({ id: chats.id });

      await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id });

      return { bot, chatId: chat.id };
    });
  } catch (error) {
    // Don't leak the sandbox if the bot could not be saved.
    await deleteSandbox(sandboxId).catch(() => {});
    throw error;
  }

  // The chat list lives in the dashboard layout, so revalidate the layout, not just the page.
  revalidatePath("/", "layout");
  return { ...created.bot, chatId: created.chatId };
}

export async function updateBot(botId: string, input: BotInput) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  const data = botInsertSchema.parse(input);

  const [bot] = await db
    .update(bots)
    .set({ ...data, instructions: data.instructions || null })
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
    .returning();
  if (!bot) throw new Error("Bot not found");

  revalidatePath("/", "layout");
  return bot;
}

export async function deleteBot(botId: string) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    const [bot] = await tx
      .select({ id: bots.id, sandboxId: bots.sandboxId })
      .from(bots)
      .where(and(eq(bots.id, botId), eq(bots.userId, userId)));
    if (!bot) throw new Error("Bot not found");

    // Remove its direct chats first; memberships cascade from both the chat and the bot.
    const direct = await tx
      .select({ id: chats.id })
      .from(chats)
      .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
      .where(
        and(
          eq(chatMembers.botId, botId),
          eq(chats.userId, userId),
          eq(chats.kind, "direct"),
        ),
      );
    if (direct.length > 0) {
      await tx.delete(chats).where(
        inArray(
          chats.id,
          direct.map((c) => c.id),
        ),
      );
    }

    await tx.delete(bots).where(eq(bots.id, botId));

    // Last step, so a failure here rolls the whole deletion back.
    if (bot.sandboxId) await deleteSandbox(bot.sandboxId);
  });

  revalidatePath("/", "layout");
}
