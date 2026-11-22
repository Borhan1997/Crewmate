"use client";

import { BuildingIcon, MonitorIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteGroupChat } from "@/actions/chat";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { GroupChatAvatar } from "@/components/group-chat-avatar";
import { useSidePanel } from "@/components/side-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
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

function DeleteGroupButton({ chat }: { chat: Chat }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirm() {
    setIsDeleting(true);
    try {
      await deleteGroupChat(chat.id);
      toast.add({ title: `${chat.name} deleted`, type: "success" });
      setOpen(false);
      router.push("/");
    } catch {
      toast.add({ title: "Could not delete group", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            className="sm:mr-auto"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {chat.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the group chat for good. Its bots are kept. It
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={confirm}
          >
            {isDeleting && <Spinner data-icon="inline-start" />}
            Delete group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function GroupDialog({ chat }: { chat: Chat }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            type="button"
            aria-label={`Open ${chat.name}`}
            className="max-w-full gap-3 px-2"
          />
        }
      >
        <GroupChatAvatar bots={chat.bots} className="size-8" />
        <span className="truncate text-base font-medium">{chat.name}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{chat.name}</DialogTitle>
          <DialogDescription>
            {chat.bots.length} bots are in this group.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {chat.bots.map((bot) => (
            <li key={bot.id} className="flex items-center gap-3">
              <ChatAvatar seed={bot.avatar} className="size-6" />
              <span>{bot.name}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DeleteGroupButton chat={chat} />
          <DialogClose render={<Button type="button" variant="outline" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChatHeader({ chat }: { chat: Chat }) {
  const isGroup = chat.kind === "group";
  const [bot] = chat.bots;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <h1 className="min-w-0 flex-1">
        {isGroup ? (
          <GroupDialog chat={chat} />
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
