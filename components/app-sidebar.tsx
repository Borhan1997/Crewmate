"use client";

import { UserButton } from "@clerk/nextjs";
import { formatDistanceToNowStrict } from "date-fns";
import { PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchCommand } from "@/components/search-command";
import type { SidebarChat } from "@/queries/bots";

function SidebarChatItem({ chat }: { chat: SidebarChat }) {
  // The bot avatar only animates while the row is hovered or focused.
  const [active, setActive] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        tooltip={chat.bot.name}
        render={<a href={`/chats/${chat.id}`} />}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      >
        <ChatAvatar seed={chat.bot.avatar} animated={active} className="size-8" />
        <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium">{chat.bot.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNowStrict(chat.lastMessageAt)}
            </span>
          </div>
          {chat.lastMessagePreview && (
            <span className="truncate text-xs text-muted-foreground">
              {chat.lastMessagePreview}
            </span>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ chats }: { chats: SidebarChat[] }) {
  const [botDialogOpen, setBotDialogOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Create new"
                className="self-end group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:self-center"
              />
            }
          >
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
              <PlusIcon />
              Create new bot
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UsersIcon />
              Create group chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SearchCommand chats={chats} />
      </SidebarHeader>
      <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarChatItem key={chat.id} chat={chat} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<div />} className="p-0 group-data-[collapsible=icon]:p-0!">
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonBox:
                      "w-full flex-row! justify-start! gap-2 p-2 text-sm group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0!",
                    userButtonTrigger:
                      "order-first! rounded-md shadow-none focus-visible:ring-2",
                    userButtonOuterIdentifier:
                      "order-last! group-data-[collapsible=icon]:hidden! truncate p-0! text-sm! font-normal! text-sidebar-foreground!",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
