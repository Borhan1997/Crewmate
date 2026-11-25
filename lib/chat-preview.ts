import type { UIMessage } from "ai";

const MAX_LENGTH = 140;

/** One-line text of the newest message that has any, for the sidebar. */
export function lastMessagePreview(messages: UIMessage[]): string | null {
  for (const message of messages.toReversed()) {
    const text = message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text;
    }
  }
  return null;
}
