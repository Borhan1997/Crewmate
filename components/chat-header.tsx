import { BuildingIcon, MonitorIcon } from "lucide-react";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { Button } from "@/components/ui/button";
import type { Chat } from "@/queries/chats";

export function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <h1 className="min-w-0 flex-1">
        <BotDialog bot={chat.bot}>
          <Button
            variant="ghost"
            type="button"
            aria-label={`Edit ${chat.bot.name}`}
            className="max-w-full gap-3 px-2"
          >
            <ChatAvatar seed={chat.bot.avatar} className="size-8" />
            <span className="truncate text-base font-medium">
              {chat.bot.name}
            </span>
          </Button>
        </BotDialog>
      </h1>
      <Button variant="ghost" size="icon" aria-label="Office" type="button">
        <BuildingIcon />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Desktop" type="button">
        <MonitorIcon />
      </Button>
    </header>
  );
}
