"use server";

import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@trigger.dev/sdk";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { chat, defaultStorage } from "@trigger.dev/sdk/ai";

import { db } from "@/db";
import {
  type GroupChatInput,
  bots,
  chatMembers,
  chats,
  groupChatInsertSchema,
} from "@/db/schema";
import { getChat } from "@/queries/chats";

/** Throws unless the chat belongs to the signed-in user. */
async function assertChatOwner(chatId: string) {
  const { isAuthenticated } = await clerkAuth();
  if (!isAuthenticated || !(await getChat(chatId)))
    throw new Error("Unauthorized");
}

const startSession = chat.createStartSessionAction("crewmate-chat");
const loadStoredTranscript = chat.createLoadTranscriptAction(defaultStorage, {
  limit: 50,
});

export async function startChatSession(
  args: Parameters<typeof startSession>[0],
) {
  await assertChatOwner(args.chatId);
  return startSession(args);
}

export async function mintChatAccessToken(chatId: string) {
  await assertChatOwner(chatId);
  return auth.createPublicToken({
    scopes: { read: { sessions: chatId }, write: { sessions: chatId } },
    expirationTime: "1h",
  });
}

export async function loadTranscript(
  args: Parameters<typeof loadStoredTranscript>[0],
) {
  await assertChatOwner(args.chatId);
  return loadStoredTranscript(args);
}

export async function createGroupChat(input: GroupChatInput) {
  const { isAuthenticated, userId } = await clerkAuth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  const data = groupChatInsertSchema.parse(input);
  const botIds = [...new Set(data.botIds)];

  // Only the user's own bots may join.
  const owned = await db
    .select({ id: bots.id })
    .from(bots)
    .where(and(eq(bots.userId, userId), inArray(bots.id, botIds)));
  if (owned.length !== botIds.length) throw new Error("Bot not found");

  const chat = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(chats)
      .values({ userId, kind: "group", name: data.name })
      .returning({ id: chats.id });
    await tx
      .insert(chatMembers)
      .values(botIds.map((botId) => ({ chatId: created.id, botId })));
    return created;
  });

  revalidatePath("/", "layout");
  return chat;
}

export async function updateGroupChat(chatId: string, input: GroupChatInput) {
  const { isAuthenticated, userId } = await clerkAuth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  const data = groupChatInsertSchema.parse(input);
  const botIds = [...new Set(data.botIds)];

  const owned = await db
    .select({ id: bots.id })
    .from(bots)
    .where(and(eq(bots.userId, userId), inArray(bots.id, botIds)));
  if (owned.length !== botIds.length) throw new Error("Bot not found");

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(chats)
      .set({ name: data.name })
      .where(
        and(
          eq(chats.id, chatId),
          eq(chats.userId, userId),
          eq(chats.kind, "group"),
        ),
      )
      .returning({ id: chats.id });
    if (!updated) throw new Error("Chat not found");

    // Drop members that were unticked, add the new ones; the rest keep their join order.
    await tx
      .delete(chatMembers)
      .where(
        and(
          eq(chatMembers.chatId, chatId),
          notInArray(chatMembers.botId, botIds),
        ),
      );
    await tx
      .insert(chatMembers)
      .values(botIds.map((botId) => ({ chatId, botId })))
      .onConflictDoNothing();
  });

  revalidatePath("/", "layout");
}

export async function deleteGroupChat(chatId: string) {
  const { isAuthenticated, userId } = await clerkAuth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  // Memberships cascade. The bots themselves are untouched.
  const deleted = await db
    .delete(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.userId, userId),
        eq(chats.kind, "group"),
      ),
    )
    .returning({ id: chats.id });
  if (deleted.length === 0) throw new Error("Chat not found");

  revalidatePath("/", "layout");
}
