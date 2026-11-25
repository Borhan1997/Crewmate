import { anthropic } from "@ai-sdk/anthropic";
import { chat } from "@trigger.dev/sdk/ai";
import { stepCountIs } from "ai";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { UIMessage } from "ai";

import { db } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";
import { botSystemPrompt } from "@/lib/bot-prompt";
import { lastMessagePreview } from "@/lib/chat-preview";
import { activeBotId, createChatTools, startTurn } from "@/lib/chat-tools";

function loadMembers(chatId: string) {
  return db
    .select({
      id: bots.id,
      name: bots.name,
      job: bots.job,
      instructions: bots.instructions,
    })
    .from(chatMembers)
    .innerJoin(bots, eq(bots.id, chatMembers.botId))
    .where(eq(chatMembers.chatId, chatId))
    .orderBy(asc(chatMembers.joinedAt));
}

// The transcript lives in Trigger.dev storage, so the sidebar's preview of the
// latest message is mirrored into the chat row at the start and end of a turn.
async function saveLastMessage(chatId: string, messages: UIMessage[]) {
  const preview = lastMessagePreview(messages);
  if (!preview) return;
  await db
    .update(chats)
    .set({ lastMessagePreview: preview, lastMessageAt: new Date() })
    .where(eq(chats.id, chatId));
}

// No `storage` set: the default transcript storage keeps the conversation
// per chat id (the Session's chatId) in platform object storage.
//
// `botId` arrives through the transport's client data: in a group chat it is
// the bot the user picked for this turn. It is only a request: the bot must
// be a member of the chat. A bot can pass the turn on to a teammate with the
// `handoff` tool; the system prompt and the sandbox then follow the new bot.
export const crewmateChat = chat.agent({
  id: "crewmate-chat",
  clientDataSchema: z.object({ botId: z.string().optional() }),
  tools: ({ chatId, clientData }) =>
    createChatTools(chatId, clientData?.botId, () => loadMembers(chatId)),
  onTurnStart: ({ chatId, uiMessages }) => saveLastMessage(chatId, uiMessages),
  onTurnComplete: ({ chatId, uiMessages }) => saveLastMessage(chatId, uiMessages),
  run: async ({ chatId, clientData, messages, tools, signal, streamText }) => {
    const botId = clientData?.botId;
    const members = await loadMembers(chatId);
    const first = botId ? members.find((m) => m.id === botId) : members[0];

    if (botId && !first) throw new Error("That bot is not in this chat.");

    startTurn(chatId, first?.id);

    // Stamp the reply with its author so the UI can show who answered.
    if (first)
      chat.response.write({ type: "data-bot", data: { botId: first.id } });

    // Only a group chat has someone to hand over to.
    const canHandOff = members.length > 1;
    const withoutHandoff = Object.keys(tools).filter(
      (name) => name !== "handoff",
    ) as (keyof typeof tools)[];

    // Built per step, as a handoff changes who is answering mid-turn.
    const systemForActiveBot = () => {
      const current = members.find((m) => m.id === activeBotId(chatId));
      return current
        ? botSystemPrompt(
            current,
            members.filter((m) => m.id !== current.id),
          )
        : undefined;
    };

    return streamText({
      model: anthropic("claude-sonnet-5-5"),
      system: systemForActiveBot(),
      messages,
      tools,
      prepareStep: () => ({
        system: systemForActiveBot(),
        ...(canHandOff ? {} : { activeTools: withoutHandoff }),
      }),
      stopWhen: stepCountIs(25),
      abortSignal: signal,
    });
  },
});
