"use client";

import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthShell } from "@/components/auth/auth-shell";
import { CodeForm } from "@/components/auth/code-form";
import { CredentialsFields } from "@/components/auth/credentials-fields";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { signUpSchema, type SignUpValues } from "@/lib/auth-schemas";

export function SignUpForm() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const [needsCode, setNeedsCode] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  async function finalize() {
    await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/home");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  }

  async function onSubmit(values: SignUpValues) {
    try {
      const { error } = await signUp.password({
        emailAddress: values.email,
        password: values.password,
      });
      if (error) {
        form.setError("password", { message: error.message });
        return;
      }
      if (signUp.status === "complete") return finalize();
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        toast.add({ title: sendError.message, type: "error" });
        return;
      }
      setNeedsCode(true);
    } catch {
      toast.add({ title: "Could not create your account", type: "error" });
    }
  }

  async function verify(code: string) {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return error;
    if (signUp.status === "complete") await finalize();
    return null;
  }

  if (needsCode) {
    return (
      <AuthShell
        title="Check your email"
        description={`We sent a verification code to ${form.getValues("email")}.`}
        footer={
          <button type="button" className="underline-offset-4 hover:underline" onClick={() => { signUp.reset(); setNeedsCode(false); }}>
            Use a different email
          </button>
        }
      >
        <CodeForm onVerify={verify} onResend={async () => { await signUp.verifications.sendEmailCode(); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Hire your first teammate in a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <GoogleButton
          start={() =>
            signUp.sso({ strategy: "oauth_google", redirectUrl: "/home", redirectCallbackUrl: "/sso-callback" })
          }
        />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <CredentialsFields control={form.control} newPassword />
          {/* Clerk's bot protection renders its challenge here. */}
          <div id="clerk-captcha" />
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
