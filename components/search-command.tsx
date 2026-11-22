"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatAvatar } from "@/components/chat-avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import type { SidebarChat } from "@/queries/bots";

export function SearchCommand({ chats }: { chats: SidebarChat[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg border-input bg-transparent px-2.5 py-1 text-base font-normal text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:p-0 md:text-sm dark:bg-input/30 dark:group-data-[collapsible=icon]:bg-transparent dark:group-data-[collapsible=icon]:hover:bg-muted/50"
      >
        <SearchIcon />
        <span className="group-data-[collapsible=icon]:hidden">Search</span>
        <Kbd className="ml-auto bg-transparent group-data-[collapsible=icon]:hidden">
          ⌘K
        </Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Find a chat by bot name or message."
      >
        <Command>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.id}
                  keywords={[chat.bot.name, chat.lastMessagePreview ?? ""]}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/chats/${chat.id}`);
                  }}
                >
                  <ChatAvatar seed={chat.bot.avatar} className="size-6" />
                  <span className="shrink-0 font-medium">{chat.bot.name}</span>
                  {chat.lastMessagePreview && (
                    <span className="truncate text-muted-foreground">
                      {chat.lastMessagePreview}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
