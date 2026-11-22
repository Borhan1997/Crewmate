"use client";

import {
  isToolUIPart,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import {
  FileTextIcon,
  FolderOpenIcon,
  KeyboardIcon,
  MonitorIcon,
  MousePointerClickIcon,
  MousePointerIcon,
  PencilLineIcon,
  ScrollTextIcon,
  TerminalIcon,
  type LucideIcon,
} from "lucide-react";

import { Image } from "@/components/ai-elements/image";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import type { SandboxTools } from "@/lib/sandbox-tools";

export type ChatMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<SandboxTools>
>;
type Part = ChatMessage["parts"][number];

type Summary = {
  icon: LucideIcon;
  /** Title while the call is running and once it is done. */
  running: string;
  done: string;
  detail?: string;
};

function summarize(part: Part): Summary | null {
  if (!isToolUIPart(part)) return null;
  switch (part.type) {
    case "tool-bash":
      return {
        icon: TerminalIcon,
        running: "Running command",
        done: "Ran command",
        detail: part.input?.command,
      };
    case "tool-read_file":
      return {
        icon: FileTextIcon,
        running: "Reading file",
        done: "Read file",
        detail: part.input?.path,
      };
    case "tool-write_file":
      return {
        icon: PencilLineIcon,
        running: "Writing file",
        done: "Wrote file",
        detail: part.input?.path,
      };
    case "tool-list_files":
      return {
        icon: FolderOpenIcon,
        running: "Listing files",
        done: "Listed files",
        detail: part.input?.path,
      };
    case "tool-mouse_click":
      return {
        icon: MousePointerClickIcon,
        running: "Clicking",
        done: part.input?.double ? "Double-clicked" : "Clicked",
        detail: part.input && `${part.input.x}, ${part.input.y}`,
      };
    case "tool-mouse_move":
      return {
        icon: MousePointerIcon,
        running: "Moving the mouse",
        done: "Moved the mouse",
        detail: part.input && `${part.input.x}, ${part.input.y}`,
      };
    case "tool-mouse_scroll":
      return {
        icon: ScrollTextIcon,
        running: "Scrolling",
        done: "Scrolled",
        detail:
          part.input &&
          `${part.input.direction} at ${part.input.x}, ${part.input.y}`,
      };
    case "tool-keyboard_type":
      return {
        icon: KeyboardIcon,
        running: "Typing",
        done: "Typed",
        detail: part.input?.text,
      };
    case "tool-keyboard_press":
      return {
        icon: KeyboardIcon,
        running: "Pressing a key",
        done: "Pressed a key",
        detail:
          part.input &&
          [...(part.input.modifiers ?? []), part.input.key].join("+"),
      };
    case "tool-show_screen":
      return {
        icon: MonitorIcon,
        running: "Taking a screenshot",
        done: "Screenshot",
      };
    default:
      return null;
  }
}

/** The expandable body of a call: its full command, output or listing. */
function details(part: Part): string | null {
  if (!isToolUIPart(part) || part.state !== "output-available") return null;
  switch (part.type) {
    case "tool-bash":
      return `$ ${part.input.command}\n${part.output.output}`.trimEnd();
    case "tool-read_file":
      return part.output.content;
    case "tool-list_files":
      return part.output.files
        .map((f) => (f.isDir ? `${f.name}/` : f.name))
        .join("\n");
    default:
      return null;
  }
}

export function ToolCall({ part }: { part: Part }) {
  // view_screen is for the agent's eyes only and is never rendered.
  if (part.type === "tool-view_screen") return null;

  const summary = summarize(part);
  if (!summary || !isToolUIPart(part)) return null;

  const Icon = summary.icon;
  const failed = part.state === "output-error";
  const running =
    part.state === "input-streaming" || part.state === "input-available";
  const body = failed ? part.errorText : details(part);

  const line = (
    <TraceLine status={failed ? "error" : running ? "running" : undefined}>
      <TraceIcon>
        <Icon />
      </TraceIcon>
      <TraceTitle>
        {running
          ? summary.running
          : failed
            ? `Failed: ${summary.done.toLowerCase()}`
            : summary.done}
      </TraceTitle>
      {summary.detail ? (
        <TraceDescription className="truncate font-mono text-xs">
          {summary.detail}
        </TraceDescription>
      ) : null}
    </TraceLine>
  );

  return (
    <Trace>
      {body ? (
        <TraceCollapsible>
          <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <CodeBlock size="sm" variant={failed ? "destructive" : "default"}>
              <CodeBlockContent wrap className="max-h-64">
                {body}
              </CodeBlockContent>
            </CodeBlock>
          </TraceCollapsibleContent>
        </TraceCollapsible>
      ) : (
        line
      )}
      {part.type === "tool-show_screen" && part.state === "output-available" ? (
        <figure className="flex max-w-xl flex-col gap-2">
          <Image
            base64={part.output.base64}
            mediaType={part.output.mediaType}
            uint8Array={new Uint8Array()}
            alt={part.output.caption ?? "Screenshot of the desktop"}
            className="border"
          />
          {part.output.caption ? (
            <figcaption className="text-sm text-muted-foreground">
              {part.output.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </Trace>
  );
}
