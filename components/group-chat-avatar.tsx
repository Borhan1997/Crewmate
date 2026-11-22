import { ChatAvatar } from "@/components/chat-avatar";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

type Slot = { left: number; top: number; size: number };

// Positions as a percentage of the square, by number of tiles.
const LAYOUTS: Record<number, Slot[]> = {
  // Side by side, overlapping.
  2: [
    { left: 0, top: 20, size: 60 },
    { left: 40, top: 20, size: 60 },
  ],
  // A triangle.
  3: [
    { left: 23, top: 0, size: 54 },
    { left: 0, top: 46, size: 54 },
    { left: 46, top: 46, size: 54 },
  ],
  // A 2x2 grid.
  4: [
    { left: 0, top: 0, size: 50 },
    { left: 50, top: 0, size: 50 },
    { left: 0, top: 50, size: 50 },
    { left: 50, top: 50, size: 50 },
  ],
};

type GroupChatAvatarProps = {
  bots: { id: string; avatar: string }[];
  animated?: boolean;
  /** Sizes the whole square, exactly like a single ChatAvatar. */
  className?: string;
};

/**
 * Up to three bot avatars; any further bots collapse into a "+N" tile. The
 * whole thing is a square the size of one ChatAvatar.
 */
export function GroupChatAvatar({
  bots,
  animated = false,
  className,
}: GroupChatAvatarProps) {
  const hidden = bots.length - MAX_VISIBLE;
  const visible = bots.slice(0, hidden > 0 ? MAX_VISIBLE : bots.length);
  const slots = LAYOUTS[Math.min(Math.max(visible.length + (hidden > 0 ? 1 : 0), 2), 4)];

  return (
    <div className={cn("relative size-8 shrink-0", className)} aria-hidden>
      {slots.map((slot, i) => {
        const bot = visible[i];
        return (
          <div
            key={bot?.id ?? "more"}
            className="absolute"
            style={{
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.size}%`,
              height: `${slot.size}%`,
            }}
          >
            {bot ? (
              <ChatAvatar
                seed={bot.avatar}
                animated={animated}
                className="size-full"
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-muted text-[0.6em] font-medium text-muted-foreground">
                +{hidden}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
