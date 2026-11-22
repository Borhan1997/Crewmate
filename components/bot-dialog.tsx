"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ShuffleIcon, Trash2Icon } from "lucide-react";

import { createBot, deleteBot, updateBot } from "@/actions/bot";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { type BotInput, botInsertSchema } from "@/db/schema";

const JOB_SUGGESTIONS = [
  "Research assistant",
  "Code reviewer",
  "Writing editor",
  "Tutor",
];

type EditableBot = {
  id: string;
  name: string;
  avatar: string;
  job: string;
  instructions: string | null;
};

export function BotDialog({
  bot,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  /** When set, the dialog edits this bot instead of creating a new one. */
  bot?: EditableBot;
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
        <BotForm bot={bot} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteBotButton({
  bot,
  onDeleted,
  disabled,
}: {
  bot: EditableBot;
  onDeleted: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirm() {
    setIsDeleting(true);
    try {
      await deleteBot(bot.id);
      toast.add({ title: `${bot.name} deleted`, type: "success" });
      setOpen(false);
      onDeleted();
      router.push("/");
    } catch {
      toast.add({ title: "Could not delete bot", type: "error" });
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
          <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the bot and its chat for good. It can&apos;t be undone.
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
            Delete bot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BotForm({ bot, onDone }: { bot?: EditableBot; onDone: () => void }) {
  const [seed, setSeed] = useState(() => bot?.avatar ?? nanoid());

  const form = useForm<BotInput>({
    resolver: zodResolver(botInsertSchema),
    defaultValues: {
      name: bot?.name ?? "",
      avatar: seed,
      job: bot?.job ?? "",
      instructions: bot?.instructions ?? "",
    },
  });
  const { isSubmitting } = form.formState;

  function shuffle() {
    const next = nanoid();
    setSeed(next);
    form.setValue("avatar", next);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (bot) {
        const updated = await updateBot(bot.id, values);
        toast.add({ title: `${updated.name} updated`, type: "success" });
      } else {
        const created = await createBot(values);
        toast.add({ title: `${created.name} is ready`, type: "success" });
      }
      onDone();
    } catch {
      toast.add({
        title: bot ? "Could not update bot" : "Could not create bot",
        type: "error",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
        <DialogDescription>
          {bot
            ? "Change its face, name, job, or how it works."
            : "Give it a face, a name, and a job to do."}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <div className="flex flex-wrap gap-2">
          {JOB_SUGGESTIONS.map((job) => (
            <Button
              key={job}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                form.setValue("job", job, { shouldValidate: true })
              }
            >
              {job}
            </Button>
          ))}
        </div>

        <Field orientation="horizontal">
          <ChatAvatar seed={seed} className="size-12" />
          <div className="flex flex-1 flex-col gap-1">
            <FieldLabel>Face</FieldLabel>
            <FieldDescription>Shuffle until you find one you like.</FieldDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={shuffle}>
            <ShuffleIcon data-icon="inline-start" />
            Shuffle
          </Button>
        </Field>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-name">Name</FieldLabel>
              <Input
                {...field}
                id="bot-name"
                placeholder="Ada"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="job"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-job">Job</FieldLabel>
              <Input
                {...field}
                id="bot-job"
                placeholder="Research assistant"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="instructions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-instructions">How it should work</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="bot-instructions"
                rows={4}
                placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        {bot && (
          <DeleteBotButton bot={bot} onDeleted={onDone} disabled={isSubmitting} />
        )}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {bot ? "Save changes" : "Create bot"}
        </Button>
      </DialogFooter>
    </form>
  );
}
