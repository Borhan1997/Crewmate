"use client";

import {
  BrainIcon,
  CheckCheckIcon,
  MessageSquareIcon,
  MonitorIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "You ask",
    icon: MessageSquareIcon,
    title: "Describe the work like you would to a coworker",
    body: "Message one bot, or a whole group. No prompts to engineer, no forms to fill in.",
  },
  {
    label: "The right teammate",
    icon: UsersIcon,
    title: "The request reaches whoever's job it is",
    body: "In a group, a bot that isn't the right fit hands the request to the teammate who is, and says so in the chat.",
  },
  {
    label: "It plans",
    icon: BrainIcon,
    title: "It reads its job and its notes, then decides",
    body: "Each bot keeps its instructions and what it learned in earlier chats, so you never start from scratch.",
  },
  {
    label: "It works",
    icon: MonitorIcon,
    title: "It gets on its own computer and does the work",
    body: "It opens apps, browses and types just like you would. Watch it live, or close the tab: it keeps going.",
  },
  {
    label: "It reports back",
    icon: CheckCheckIcon,
    title: "Finished work lands in the chat",
    body: "You get the result, and the bot saves what it learned so the next job goes faster.",
  },
];

const STEP_MS = 2500;

export function Architecture() {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (hovering) return;
    const id = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setActive((i) => (i + 1) % STEPS.length);
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, hovering]);

  const step = STEPS[active];

  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            From a message to finished work. Pick a step to look closer.
          </p>
        </div>
      </div>

      <div
        className="mt-12 flex flex-col md:flex-row md:items-start"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          const reached = i <= active;
          return (
            <div key={s.label} className="contents">
              {i > 0 && (
                <div
                  aria-hidden
                  className="ml-6 h-8 w-px overflow-hidden bg-border md:ml-0 md:mt-6 md:h-px md:w-auto md:flex-1"
                >
                  <div
                    className={cn(
                      "size-full origin-top bg-foreground transition-transform duration-400 ease-out md:origin-left",
                      reached
                        ? "scale-100"
                        : "scale-y-0 md:scale-x-0 md:scale-y-100",
                    )}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={isActive ? "step" : undefined}
                className="group flex items-center gap-4 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:w-28 md:flex-col md:text-center"
              >
                <span
                  className={cn(
                    "relative flex size-12 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : reached
                        ? "border-foreground bg-background text-foreground"
                        : "border-border bg-background text-muted-foreground group-hover:border-foreground",
                  )}
                >
                  {isActive && (
                    <span className="absolute -inset-1.5 animate-ping rounded-full border border-foreground/30 motion-reduce:hidden" />
                  )}
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "text-base transition-colors",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div
        key={active}
        aria-live="polite"
        className="mt-12 flex flex-col gap-3 rounded-xl border bg-muted/40 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-8"
      >
        <span className="text-sm text-muted-foreground">
          Step {active + 1} of {STEPS.length}
        </span>
        <h3 className="text-2xl font-medium tracking-tight text-balance">
          {step.title}
        </h3>
        <p className="max-w-2xl text-lg text-muted-foreground">{step.body}</p>
      </div>
    </section>
  );
}
