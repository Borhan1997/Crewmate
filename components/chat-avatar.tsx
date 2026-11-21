import { Avatar, Style } from "@dicebear/core";
import miniavs from "@dicebear/styles/miniavs.json" with { type: "json" };
import Image from "next/image";
import { cn } from "@/lib/utils";

const style = new Style(miniavs);

type ChatAvatarProps = {
  seed: string;
  /**
   * Turns on DiceBear's opt-in animation. Miniavs has no animated variants, so
   * this has no visible effect until the style is swapped for an animated one.
   */
  animated?: boolean;
  className?: string;
};

export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = new Avatar(style, {
    seed,
    tags: [animated ? "animation" : "!animation"],
  }).toDataUri();

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn("size-8 shrink-0 rounded-full", className)}
    />
  );
}
