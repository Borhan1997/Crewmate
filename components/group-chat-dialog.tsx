"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { createGroupChat } from "@/actions/chat";
import { ChatAvatar } from "@/components/chat-avatar";
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

export function GroupChatDialog({
  bots,
  open,
  onOpenChange,
}: {
  bots: PickableBot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <GroupChatForm bots={bots} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function GroupChatForm({
  bots,
  onDone,
}: {
  bots: PickableBot[];
  onDone: () => void;
}) {
  const router = useRouter();
  const form = useForm<GroupChatInput>({
    resolver: zodResolver(groupChatInsertSchema),
    defaultValues: { name: "", botIds: [] },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await createGroupChat(values);
      toast.add({ title: `${values.name} is ready`, type: "success" });
      onDone();
      router.push(`/chats/${created.id}`);
    } catch {
      toast.add({ title: "Could not create group", type: "error" });
    }
  });

  return (
    <form onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>New group chat</DialogTitle>
        <DialogDescription>
          Name the group and pick which bots are in it.
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
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Create group
        </Button>
      </DialogFooter>
    </form>
  );
}
