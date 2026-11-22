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
} from "@/components/ui/sidebar";
import { SearchCommand } from "@/components/search-command";
import type { SidebarChat } from "@/queries/bots";

export function AppSidebar({ chats }: { chats: SidebarChat[] }) {
  const [botDialogOpen, setBotDialogOpen] = useState(false);

  return (
    <Sidebar>
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Create new"
                className="self-end"
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
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton size="lg" render={<a href={`/chats/${chat.id}`} />}>
                    <ChatAvatar seed={chat.bot.avatar} className="size-8" />
                    <div className="flex min-w-0 flex-1 flex-col">
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<div />} className="p-0">
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonBox:
                      "w-full flex-row! justify-start! gap-2 p-2 text-sm",
                    userButtonTrigger:
                      "order-first! rounded-md shadow-none focus-visible:ring-2",
                    userButtonOuterIdentifier:
                      "order-last! truncate p-0! text-sm! font-normal! text-sidebar-foreground!",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
