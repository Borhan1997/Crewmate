import { Avatar, Style } from "@dicebear/core";
import voxelBot from "@dicebear/styles/voxel-bot.json" with { type: "json" };
import Image from "next/image";
import { cn } from "@/lib/utils";

const style = new Style(voxelBot);

/**
 * Voxel Bot's keyframes sit idle for ~85% of each cycle, so a freshly shown
 * avatar would not move for several seconds. Negative delays start every
 * cycle just before its first movement so it reacts immediately.
 */
function skipIdleStart(svg: string) {
  return svg.replace(
    "</style>",
    "@media (prefers-reduced-motion: no-preference) { .vb-blink-fastest { animation-delay: -2.2s; } .vb-upper, .vb-head { animation-delay: -3.35s; } } </style>"
  );
}

type ChatAvatarProps = {
  seed: string;
  /** Turns on Voxel Bot's built-in SVG animation. */
  animated?: boolean;
  className?: string;
};

export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const svg = new Avatar(style, {
    seed,
    // Fully transparent fill, so no background is drawn.
    backgroundColor: ["00000000"],
    animationVariant: [animated ? "fastest" : "none"],
    animationProbability: 100,
  }).toString();
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    animated ? skipIdleStart(svg) : svg
  )}`;

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn("size-8 shrink-0", className)}
    />
  );
}
