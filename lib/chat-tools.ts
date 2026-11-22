import { chat } from "@trigger.dev/sdk/ai";
import { tool } from "ai";
import { z } from "zod";

import { createSandboxTools } from "@/lib/sandbox-tools";

export const MAX_HANDOFFS_PER_TURN = 2;

export type Teammate = { id: string; name: string; job: string };

// Which bot is answering right now, per chat. The agent sets it at the start of
// every turn and the handoff tool changes it, so the tools and the system prompt
// follow the handoff. A chat's runs never overlap, so a module-level map is safe.
const turns = new Map<string, { botId?: string; handoffs: number }>();

export function startTurn(chatId: string, botId?: string) {
  turns.set(chatId, { botId, handoffs: 0 });
}

export function activeBotId(chatId: string) {
  return turns.get(chatId)?.botId;
}

/**
 * The tools of the chat agent: the sandbox tools of whichever bot is answering,
 * plus `handoff`, which passes the rest of the turn to another bot in the chat.
 */
export function createChatTools(
  chatId: string,
  clientBotId: string | undefined,
  loadTeammates: () => Promise<Teammate[]>,
) {
  const state = () => {
    let turn = turns.get(chatId);
    if (!turn) {
      turn = { botId: clientBotId, handoffs: 0 };
      turns.set(chatId, turn);
    }
    return turn;
  };

  return {
    ...createSandboxTools(chatId, () => state().botId),

    handoff: tool({
      description:
        "Hand this message over to another bot in the group chat because their job fits it better than yours. They answer the user right after, in this same turn. Only use it when the request clearly belongs to a teammate's job and not yours; never to avoid work you can do.",
      inputSchema: z.object({
        bot: z.string().describe("The name of the teammate to hand over to."),
        reason: z
          .string()
          .describe(
            "One short sentence on why they are the better fit; the teammate reads it.",
          ),
      }),
      execute: async ({ bot: target, reason }) => {
        const turn = state();
        if (turn.handoffs >= MAX_HANDOFFS_PER_TURN) {
          return {
            ok: false as const,
            error:
              "Too many handoffs this turn. Answer the user yourself with what you can.",
          };
        }
        const teammates = (await loadTeammates()).filter(
          (m) => m.id !== turn.botId,
        );
        const wanted = target.trim().toLowerCase();
        const next = teammates.find(
          (m) => m.id === target || m.name.toLowerCase() === wanted,
        );
        if (!next) {
          return {
            ok: false as const,
            error: teammates.length
              ? `No teammate called "${target}". Your teammates: ${teammates.map((m) => m.name).join(", ")}.`
              : "You are the only bot in this chat; nobody to hand over to.",
          };
        }
        turn.handoffs += 1;
        turn.botId = next.id;
        // Everything after this part is written by the new bot.
        chat.response.write({ type: "data-bot", data: { botId: next.id } });
        return {
          ok: true as const,
          botId: next.id,
          name: next.name,
          reason,
        };
      },
      toModelOutput: ({ output }) => ({
        type: "text",
        value: output.ok
          ? `Handed over to ${output.name}: ${output.reason}. ${output.name} now takes over and answers the user.`
          : output.error,
      }),
    }),
  };
}

export type ChatTools = ReturnType<typeof createChatTools>;
