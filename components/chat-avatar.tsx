import { Avatar, Style } from "@dicebear/core";
import miniavs from "@dicebear/styles/miniavs.json" with { type: "json" };
import Image from "next/image";
import { cn } from "@/lib/utils";

const style = new Style(miniavs);

type ChatAvatarProps = {
  seed: string;
  /** Miniavs has no native animation, so this applies a CSS bob to the image. */
  animated?: boolean;
  className?: string;
};

export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = new Avatar(style, { seed }).toDataUri();

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn(
        "size-8 shrink-0 rounded-full",
        animated && "animate-avatar-bob motion-reduce:animate-none",
        className
      )}
    />
  );
}
