import { ChatAvatar } from "@/components/chat-avatar";
import { Cta } from "./cta";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 pt-48 pb-20 text-center sm:px-6 sm:pt-56">
      <h1 className="flex items-center justify-center gap-[0.15em] text-4xl font-medium tracking-tight sm:text-6xl md:text-7xl">
        Meet Crewmate
        <ChatAvatar animated crop="head" seed="sales" className="h-[1.25em] w-auto" />
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground text-balance sm:text-xl">
        Open-source AI teammates with a job, a memory and a cloud computer of
        their own. Give them real work and they come back with it finished.
      </p>
      <Cta />
      <a
        href="#how-it-works"
        className="text-base text-muted-foreground underline-offset-4 hover:underline"
      >
        See how it works
      </a>
    </section>
  );
}
