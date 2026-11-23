"use client";

import { BuildingIcon, MonitorIcon } from "lucide-react";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { GroupChatAvatar } from "@/components/group-chat-avatar";
import { GroupChatDialog } from "@/components/group-chat-dialog";
import { useSidePanel } from "@/components/side-panel";
import { Button } from "@/components/ui/button";
import type { Chat } from "@/queries/chats";

function DesktopButton() {
  const { toggle } = useSidePanel();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Desktop"
      type="button"
      onClick={() => toggle("desktop")}
    >
      <MonitorIcon />
    </Button>
  );
}

export function ChatHeader({
  chat,
  bots,
}: {
  chat: Chat;
  /** All of the user's bots, for picking group members. */
  bots: { id: string; name: string; avatar: string }[];
}) {
  const isGroup = chat.kind === "group";
  const [bot] = chat.bots;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <h1 className="min-w-0 flex-1">
        {isGroup ? (
          <GroupChatDialog
            bots={bots}
            group={{
              id: chat.id,
              name: chat.name,
              botIds: chat.bots.map((b) => b.id),
            }}
          >
            <Button
              variant="ghost"
              type="button"
              aria-label={`Edit ${chat.name}`}
              className="max-w-full gap-3 px-2"
            >
              <GroupChatAvatar bots={chat.bots} className="size-8" />
              <span className="truncate text-base font-medium">
                {chat.name}
              </span>
            </Button>
          </GroupChatDialog>
        ) : (
          <BotDialog bot={bot}>
            <Button
              variant="ghost"
              type="button"
              aria-label={`Edit ${bot.name}`}
              className="max-w-full gap-3 px-2"
            >
              <ChatAvatar seed={bot.avatar} className="size-8" />
              <span className="truncate text-base font-medium">{bot.name}</span>
            </Button>
          </BotDialog>
        )}
      </h1>
      <Button variant="ghost" size="icon" aria-label="Office" type="button">
        <BuildingIcon />
      </Button>
      {!isGroup && <DesktopButton />}
    </header>
  );
}
