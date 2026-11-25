"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { codeSchema, type CodeValues } from "@/lib/auth-schemas";

type CodeFormProps = {
  onVerify: (code: string) => Promise<{ message: string } | null>;
  onResend?: () => Promise<void>;
};

export function CodeForm({ onVerify, onResend }: CodeFormProps) {
  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: CodeValues) {
    try {
      const error = await onVerify(values.code);
      if (error) form.setError("code", { message: error.message });
    } catch {
      toast.add({ title: "Could not verify the code", type: "error" });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="auth-code">Verification code</FieldLabel>
              <Input
                {...field}
                id="auth-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="h-12 text-base"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Spinner data-icon="inline-start" />}
        Verify
      </Button>
      {onResend && (
        <Button type="button" variant="ghost" size="lg" onClick={onResend} disabled={isSubmitting}>
          Send a new code
        </Button>
      )}
    </form>
  );
}
