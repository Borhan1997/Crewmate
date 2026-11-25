"use client";

import { Controller, type Control } from "react-hook-form";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Values = { email: string; password: string };

export function CredentialsFields({
  control,
  newPassword,
}: {
  control: Control<Values>;
  newPassword?: boolean;
}) {
  return (
    <FieldGroup>
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="auth-email">Email address</FieldLabel>
            <Input
              {...field}
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 text-base"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="auth-password">Password</FieldLabel>
            <Input
              {...field}
              id="auth-password"
              type="password"
              autoComplete={newPassword ? "new-password" : "current-password"}
              className="h-12 text-base"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}
