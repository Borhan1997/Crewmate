import { randomUUID } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import { PlusIcon } from "lucide-react";

import { BotDialog } from "@/components/bot-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function Page() {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  return (
    <main className="flex min-h-svh p-6">
      <Empty>
        <EmptyHeader className="max-w-xl gap-3">
          <EmptyMedia>
            <ChatAvatar animated seed={randomUUID()} className="size-28" />
          </EmptyMedia>
          <EmptyTitle className="text-4xl sm:text-5xl">Meet your first bot</EmptyTitle>
          <EmptyDescription className="text-lg sm:text-xl">
            Every bot gets its own personality, memory, and face. Spin one up
            and start the conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <BotDialog>
            <Button variant="secondary" size="lg">
              <PlusIcon data-icon="inline-start" />
              Create a new bot
            </Button>
          </BotDialog>
        </EmptyContent>
      </Empty>
    </main>
  );
}
