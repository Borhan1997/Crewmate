"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { PlusIcon, UsersIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { GroupChatAvatar } from "@/components/group-chat-avatar";
import { GroupChatDialog } from "@/components/group-chat-dialog";
import { UserMenu } from "@/components/user-menu";
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
  const { chatId } = useParams<{ chatId?: string }>();
  const isCurrent = chatId === chat.id;
  const isGroup = chat.kind === "group";
  const title = (isGroup ? chat.name : null) ?? chat.bots[0].name;
  const animated = active || isCurrent;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        isActive={isCurrent}
        tooltip={title}
        render={<a href={`/chats/${chat.id}`} />}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      >
        {isGroup ? (
          <GroupChatAvatar
            bots={chat.bots}
            animated={animated}
            className="size-8"
          />
        ) : (
          <ChatAvatar
            seed={chat.bots[0].avatar}
            animated={animated}
            className="size-8"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium">{title}</span>
            <span
              suppressHydrationWarning
              className="shrink-0 text-sm text-muted-foreground"
            >
              {formatDistanceToNowStrict(chat.lastMessageAt)}
            </span>
          </div>
          {chat.lastMessagePreview && (
            <span className="truncate text-sm text-muted-foreground">
              {chat.lastMessagePreview}
            </span>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  chats,
  bots,
}: {
  chats: SidebarChat[];
  bots: { id: string; name: string; avatar: string }[];
}) {
  const [botDialogOpen, setBotDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="relative mb-4 flex items-center justify-center">
          <a
            href="/home"
            className="text-2xl font-medium tracking-tight italic group-data-[collapsible=icon]:hidden"
          >
            Crewmate
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Create new"
                  className="absolute right-0 group-data-[collapsible=icon]:static group-data-[collapsible=icon]:size-8"
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
              <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
                <UsersIcon />
                Create group chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SearchCommand chats={chats} />
      </SidebarHeader>
      <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
      <GroupChatDialog
        bots={bots}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
      />
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
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
