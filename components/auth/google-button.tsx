"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

/** Starts Clerk's Google OAuth flow; `start` is the hook's `sso` call. */
export function GoogleButton({
  start,
}: {
  start: () => Promise<{ error: { message: string } | null }>;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const { error } = await start();
      if (error) throw error;
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Could not continue with Google",
        type: "error",
      });
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="lg" className="w-full" onClick={onClick} disabled={pending}>
      {pending && <Spinner data-icon="inline-start" />}
      Continue with Google
    </Button>
  );
}
