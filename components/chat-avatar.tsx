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

/** Viewbox around Voxel Bot's head, with room for its animated movement. */
const HEAD_VIEWBOX = { x: 24, y: 10, width: 80, height: 74 };

type ChatAvatarProps = {
  seed: string;
  /** Shows only the head, as an element as wide as it is tall in the viewBox ratio. */
  crop?: "head";
  /** Turns on Voxel Bot's built-in SVG animation. */
  animated?: boolean;
  className?: string;
};

export function ChatAvatar({ seed, animated = false, crop, className }: ChatAvatarProps) {
  const svg = new Avatar(style, {
    seed,
    // Fully transparent fill, so no background is drawn.
    backgroundColor: ["00000000"],
    animationVariant: [animated ? "fastest" : "none"],
    animationProbability: 100,
  }).toString();
  const timed = animated ? skipIdleStart(svg) : svg;
  const cropped = crop
    ? timed.replace(
        'viewBox="0 0 128 128"',
        `viewBox="${HEAD_VIEWBOX.x} ${HEAD_VIEWBOX.y} ${HEAD_VIEWBOX.width} ${HEAD_VIEWBOX.height}"`
      )
    : timed;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cropped)}`;

  return (
    <Image
      src={src}
      alt=""
      width={crop ? HEAD_VIEWBOX.width : 32}
      height={crop ? HEAD_VIEWBOX.height : 32}
      unoptimized
      className={cn(crop ? "shrink-0" : "size-8 shrink-0", className)}
    />
  );
}
