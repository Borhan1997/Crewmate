"use server";

import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@trigger.dev/sdk";
import { chat, defaultStorage } from "@trigger.dev/sdk/ai";

import { getChat } from "@/queries/chats";

/** Throws unless the chat belongs to the signed-in user. */
async function assertChatOwner(chatId: string) {
  const { isAuthenticated } = await clerkAuth();
  if (!isAuthenticated || !(await getChat(chatId))) throw new Error("Unauthorized");
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
