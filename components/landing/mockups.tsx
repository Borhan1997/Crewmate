import { ChatAvatar } from "@/components/chat-avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Badge } from "@/components/ui/badge";

function BotLine({
  seed,
  name,
  children,
}: {
  seed: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <ChatAvatar seed={seed} className="size-9" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">{name}</span>
        <Bubble variant="secondary" className="max-w-full">
          <BubbleContent className="text-base">{children}</BubbleContent>
        </Bubble>
      </div>
    </div>
  );
}

function UserLine({ children }: { children: React.ReactNode }) {
  return (
    <Bubble align="end">
      <BubbleContent className="text-base">{children}</BubbleContent>
    </Bubble>
  );
}

export function JobMockup() {
  return (
    <>
      <UserLine>Four accounts renew next month. Can you prep them?</UserLine>
      <BotLine seed="sales" name="Sales Bot">
        On it. I pulled usage, ran health checks and drafted a proposal for
        each account. Want me to send them?
      </BotLine>
    </>
  );
}

export function ComputerMockup() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-2 text-sm text-muted-foreground">
        <span className="size-2 rounded-full bg-foreground" />
        Support Bot is working
      </div>
      <div className="flex flex-col gap-3 p-4 text-base">
        <span className="font-medium">acme.zendesk.com</span>
        {["Charged twice this month", "Can't sign in after reset", "Export stuck at 90%"].map(
          (t) => (
            <div key={t} className="flex justify-between border-b pb-2 last:border-0">
              <span>{t}</span>
              <span className="text-muted-foreground">open</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function HandoffMockup() {
  return (
    <>
      <UserLine>
        <Badge variant="secondary" className="mr-2">@Research Bot</Badge>
        Is the 40 hour battery claim confirmed?
      </UserLine>
      <BotLine seed="research" name="Research Bot">
        Confirmed in the spec sheet. Handing the copy fix to Support Bot.
      </BotLine>
      <BotLine seed="support" name="Support Bot">
        Got it. I&apos;ll update the help center article.
      </BotLine>
    </>
  );
}

export function MemoryMockup() {
  return (
    <>
      <div className="rounded-xl border bg-background p-4 font-mono text-sm leading-relaxed">
        <div className="mb-2 text-muted-foreground">MEMORY.md</div>
        <div>- Weekly report goes out Fridays at 9</div>
        <div>- Prefers short summaries, no emojis</div>
        <div>- Pendel Arc launch: battery is 40h</div>
      </div>
      <BotLine seed="sales" name="Sales Bot">
        Remembered from our last chat: the launch copy says 40 hours.
      </BotLine>
    </>
  );
}
