import { anthropic } from "@ai-sdk/anthropic";
import { chat } from "@trigger.dev/sdk/ai";
import { stepCountIs } from "ai";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { bots, chatMembers } from "@/db/schema";
import { createSandboxTools } from "@/lib/sandbox-tools";

// No `storage` set: the default transcript storage keeps the conversation
// per chat id (the Session's chatId) in platform object storage.
//
// `botId` arrives through the transport's client data: in a group chat it is
// the bot the user picked for this turn. It is only a request: the bot must
// be a member of the chat.
export const crewmateChat = chat.agent({
  id: "crewmate-chat",
  clientDataSchema: z.object({ botId: z.string().optional() }),
  tools: ({ chatId, clientData }) =>
    createSandboxTools(chatId, clientData?.botId),
  run: async ({ chatId, clientData, messages, tools, signal, streamText }) => {
    const botId = clientData?.botId;
    const [bot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        job: bots.job,
        instructions: bots.instructions,
      })
      .from(chatMembers)
      .innerJoin(bots, eq(bots.id, chatMembers.botId))
      .where(
        and(
          eq(chatMembers.chatId, chatId),
          botId ? eq(chatMembers.botId, botId) : undefined,
        ),
      )
      .orderBy(asc(chatMembers.joinedAt))
      .limit(1);

    if (botId && !bot) throw new Error("That bot is not in this chat.");

    // Stamp the reply with its author so the UI can show who answered.
    if (bot) chat.response.write({ type: "data-bot", data: { botId: bot.id } });

    const system = bot
      ? [
          `You are ${bot.name}, an AI teammate on Crewmate. Always stay in character as ${bot.name} and answer to that name; never present yourself as a generic assistant.`,
          `Your job: ${bot.job}.`,
          `Your purpose is to help the user with that job: understand what they need, give clear, accurate and practical help, and ask a short clarifying question when a request is ambiguous. Be honest about what you do not know.`,
          `Environment: you have your own private, isolated sandbox (a Linux machine with a desktop), kept separate from every other bot and from the user's own machine. It is created when you are created and removed when you are deleted. It is yours to use for your work.`,
          `Tools: you can run shell commands (bash), read, write and list files, and operate the desktop with the mouse and keyboard. To look at the screen yourself, use view_screen; the user does not see those screenshots. When the user asks what is on the screen or wants to see it, use show_screen, which displays it in the chat. Prefer bash and files over the desktop when either would do. Only claim what you actually did, and report failures honestly.`,
          bot.instructions &&
            `Additional instructions from the user:\n${bot.instructions}`,
        ]
          .filter(Boolean)
          .join("\n\n")
      : undefined;

    return streamText({
      model: anthropic("claude-sonnet-5-5"),
      system,
      messages,
      tools,
      stopWhen: stepCountIs(25),
      abortSignal: signal,
    });
  },
});
