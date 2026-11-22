import { anthropic } from "@ai-sdk/anthropic";
import { chat } from "@trigger.dev/sdk/ai";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers } from "@/db/schema";

// No `storage` set: the default transcript storage keeps the conversation
// per chat id (the Session's chatId) in platform object storage.
export const crewmateChat = chat.agent({
  id: "crewmate-chat",
  run: async ({ chatId, messages, signal, streamText }) => {
    const [bot] = await db
      .select({
        name: bots.name,
        job: bots.job,
        instructions: bots.instructions,
      })
      .from(chatMembers)
      .innerJoin(bots, eq(bots.id, chatMembers.botId))
      .where(eq(chatMembers.chatId, chatId))
      .orderBy(asc(chatMembers.joinedAt))
      .limit(1);

    const system = bot
      ? [
          `You are ${bot.name}, an AI teammate. Your job: ${bot.job}.`,
          `Always stay in character as ${bot.name}; answer to that name.`,
          bot.instructions && `Instructions:\n${bot.instructions}`,
        ]
          .filter(Boolean)
          .join("\n\n")
      : undefined;

    return streamText({
      model: anthropic("claude-sonnet-5-5"),
      system,
      messages,
      abortSignal: signal,
    });
  },
});
