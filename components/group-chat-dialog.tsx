"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import {
  createGroupChat,
  deleteGroupChat,
  updateGroupChat,
} from "@/actions/chat";
import { ChatAvatar } from "@/components/chat-avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { type GroupChatInput, groupChatInsertSchema } from "@/db/schema";

type PickableBot = { id: string; name: string; avatar: string };
type EditableGroup = { id: string; name: string | null; botIds: string[] };

export function GroupChatDialog({
  bots,
  group,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  bots: PickableBot[];
  /** When set, the dialog edits this group instead of creating a new one. */
  group?: EditableGroup;
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children} />}
      <DialogContent className="sm:max-w-lg">
        <GroupChatForm
          bots={bots}
          group={group}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteGroupButton({
  group,
  onDeleted,
  disabled,
}: {
  group: EditableGroup;
  onDeleted: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirm() {
    setIsDeleting(true);
    try {
      await deleteGroupChat(group.id);
      toast.add({ title: `${group.name} deleted`, type: "success" });
      setOpen(false);
      onDeleted();
      router.push("/home");
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
            disabled={disabled}
            className="sm:mr-auto"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {group.name}?</AlertDialogTitle>
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

function GroupChatForm({
  bots,
  group,
  onDone,
}: {
  bots: PickableBot[];
  group?: EditableGroup;
  onDone: () => void;
}) {
  const router = useRouter();
  const form = useForm<GroupChatInput>({
    resolver: zodResolver(groupChatInsertSchema),
    defaultValues: { name: group?.name ?? "", botIds: group?.botIds ?? [] },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (group) {
        await updateGroupChat(group.id, values);
        toast.add({ title: `${values.name} updated`, type: "success" });
        onDone();
        return;
      }
      const created = await createGroupChat(values);
      toast.add({ title: `${values.name} is ready`, type: "success" });
      onDone();
      router.push(`/chats/${created.id}`);
    } catch {
      toast.add({
        title: group ? "Could not update group" : "Could not create group",
        type: "error",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>
          {group ? "Edit group chat" : "New group chat"}
        </DialogTitle>
        <DialogDescription>
          {group
            ? "Rename the group or change which bots are in it."
            : "Name the group and pick which bots are in it."}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="group-name">Name</FieldLabel>
              <Input
                {...field}
                id="group-name"
                placeholder="Weekend plans"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="botIds"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldGroup data-invalid={fieldState.invalid}>
              <FieldLabel>Bots</FieldLabel>
              {bots.map((bot) => (
                <Field key={bot.id} orientation="horizontal">
                  <Checkbox
                    id={`group-bot-${bot.id}`}
                    checked={field.value.includes(bot.id)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, bot.id]
                          : field.value.filter((id) => id !== bot.id),
                      )
                    }
                  />
                  <ChatAvatar seed={bot.avatar} className="size-6" />
                  <FieldLabel
                    htmlFor={`group-bot-${bot.id}`}
                    className="font-normal"
                  >
                    {bot.name}
                  </FieldLabel>
                </Field>
              ))}
              <FieldError errors={[fieldState.error]} />
            </FieldGroup>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        {group && (
          <DeleteGroupButton
            group={group}
            onDeleted={onDone}
            disabled={isSubmitting}
          />
        )}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {group ? "Save changes" : "Create group"}
        </Button>
      </DialogFooter>
    </form>
  );
}
