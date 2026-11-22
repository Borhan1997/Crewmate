"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { bots, chatMembers } from "@/db/schema";
import { getStartedSandbox } from "@/lib/daytona";
import { getChat } from "@/queries/chats";

const NOVNC_PORT = 6080;

/**
 * Starts the desktop of the chat's bot sandbox (if needed) and returns a
 * WebSocket URL for its VNC server. The URL embeds a signed token bound to the
 * noVNC port only, which expires after an hour.
 */
export async function getDesktopConnection(chatId: string) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !(await getChat(chatId)))
    throw new Error("Unauthorized");

  const [row] = await db
    .select({ sandboxId: bots.sandboxId })
    .from(chatMembers)
    .innerJoin(
      bots,
      and(eq(bots.id, chatMembers.botId), eq(bots.userId, userId)),
    )
    .where(eq(chatMembers.chatId, chatId))
    .limit(1);
  if (!row?.sandboxId) throw new Error("This bot has no sandbox.");

  const sandbox = await getStartedSandbox(row.sandboxId);
  const status = await sandbox.computerUse.getStatus();
  if (status.status !== "active") await sandbox.computerUse.start();

  const { url } = await sandbox.getSignedPreviewUrl(NOVNC_PORT, 3600);
  const ws = new URL(url);
  ws.protocol = "wss:";
  ws.pathname = "/websockify";
  return ws.toString();
}
