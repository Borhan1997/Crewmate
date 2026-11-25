"use client";

import { useSignIn } from "@clerk/nextjs";
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
import { signInSchema, type SignInValues } from "@/lib/auth-schemas";

export function SignInForm() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [needsCode, setNeedsCode] = useState(false);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  async function finalize() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/home");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  }

  /** Second factors: a client-trust or MFA email code, otherwise an authenticator app. */
  const usesEmailCode = () =>
    signIn.status === "needs_client_trust" ||
    signIn.supportedSecondFactors?.some((f) => f.strategy === "email_code");

  async function onSubmit(values: SignInValues) {
    try {
      const { error } = await signIn.password({
        emailAddress: values.email,
        password: values.password,
      });
      if (error) {
        form.setError("password", { message: error.message });
        return;
      }
      if (signIn.status === "complete") return finalize();
      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        if (usesEmailCode()) await signIn.mfa.sendEmailCode();
        setNeedsCode(true);
        return;
      }
      toast.add({ title: "Could not finish signing in", type: "error" });
    } catch {
      toast.add({ title: "Could not sign in", type: "error" });
    }
  }

  async function verify(code: string) {
    const { error } = usesEmailCode()
      ? await signIn.mfa.verifyEmailCode({ code })
      : await signIn.mfa.verifyTOTP({ code });
    if (error) return error;
    if (signIn.status === "complete") await finalize();
    return null;
  }

  if (needsCode) {
    return (
      <AuthShell
        title="Check your email"
        description={
          usesEmailCode()
            ? "Enter the code we just sent to confirm it's you."
            : "Enter the code from your authenticator app."
        }
        footer={
          <button type="button" className="underline-offset-4 hover:underline" onClick={() => { signIn.reset(); setNeedsCode(false); }}>
            Use a different account
          </button>
        }
      >
        <CodeForm
          onVerify={verify}
          onResend={usesEmailCode() ? async () => { await signIn.mfa.sendEmailCode(); } : undefined}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your Crewmate account."
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <GoogleButton
          start={() =>
            signIn.sso({ strategy: "oauth_google", redirectUrl: "/home", redirectCallbackUrl: "/sso-callback" })
          }
        />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <CredentialsFields control={form.control} />
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
