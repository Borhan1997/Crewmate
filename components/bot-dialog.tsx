"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ShuffleIcon } from "lucide-react";

import { createBot } from "@/actions/bot";
import { ChatAvatar } from "@/components/chat-avatar";
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

export function BotDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
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
        <BotForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function BotForm({ onCreated }: { onCreated: () => void }) {
  const [seed, setSeed] = useState(() => nanoid());

  const form = useForm<BotInput>({
    resolver: zodResolver(botInsertSchema),
    defaultValues: { name: "", avatar: seed, job: "", instructions: "" },
  });
  const { isSubmitting } = form.formState;

  function shuffle() {
    const next = nanoid();
    setSeed(next);
    form.setValue("avatar", next);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const bot = await createBot(values);
      toast.add({ title: `${bot.name} is ready`, type: "success" });
      onCreated();
    } catch {
      toast.add({ title: "Could not create bot", type: "error" });
    }
  });

  return (
    <form onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>New bot</DialogTitle>
        <DialogDescription>
          Give it a face, a name, and a job to do.
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
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Create bot
        </Button>
      </DialogFooter>
    </form>
  );
}
