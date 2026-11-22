import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { bots, chatMembers } from "@/db/schema";
import { getStartedSandbox } from "@/lib/daytona";

const MAX_TEXT = 20_000;

function clip(text: string) {
  return text.length > MAX_TEXT
    ? `${text.slice(0, MAX_TEXT)}\n… [truncated ${text.length - MAX_TEXT} characters]`
    : text;
}

/**
 * The agent's tools, all acting on the sandbox that belongs to the bot in this chat.
 * The sandbox is looked up lazily on first use and started if it is stopped.
 */
export function createSandboxTools(
  chatId: string,
  /** The bot acting right now; read on every call, as a handoff can change it mid-turn. */
  currentBotId: () => string | undefined,
) {
  // Cached per bot, so a handoff switches to the new bot's own sandbox.
  const sandboxes = new Map<string, ReturnType<typeof getStartedSandbox>>();
  const desktops = new Map<string, Promise<void>>();

  function sandbox() {
    const botId = currentBotId();
    const key = botId ?? "";
    let sandboxPromise = sandboxes.get(key);
    if (sandboxPromise) return sandboxPromise;
    sandboxPromise = (async () => {
      const [row] = await db
        .select({ sandboxId: bots.sandboxId })
        .from(chatMembers)
        .innerJoin(bots, eq(bots.id, chatMembers.botId))
        .where(
          botId
            ? and(eq(chatMembers.chatId, chatId), eq(chatMembers.botId, botId))
            : eq(chatMembers.chatId, chatId),
        )
        .limit(1);
      if (!row?.sandboxId) throw new Error("This bot has no sandbox.");
      return getStartedSandbox(row.sandboxId);
    })();
    sandboxes.set(key, sandboxPromise);
    // Don't cache a failure: the next call retries.
    sandboxPromise.catch(() => sandboxes.delete(key));
    return sandboxPromise;
  }

  /** Starts the desktop (Xvfb, VNC, ...) once, before the first computer-use call. */
  async function desktop() {
    const box = await sandbox();
    const key = currentBotId() ?? "";
    let ready = desktops.get(key);
    if (!ready) {
      ready = (async () => {
        const status = await box.computerUse.getStatus();
        if (status.status !== "active") await box.computerUse.start();
      })();
      desktops.set(key, ready);
      ready.catch(() => desktops.delete(key));
    }
    await ready;
    return box.computerUse;
  }

  async function screenshot() {
    const computer = await desktop();
    const shot = await computer.screenshot.takeCompressed({
      format: "jpeg",
      quality: 70,
      showCursor: true,
    });
    if (!shot.screenshot) throw new Error("The screenshot was empty.");
    return { base64: shot.screenshot, mediaType: "image/jpeg" };
  }

  return {
    bash: tool({
      description:
        "Run a shell command in your sandbox and get its exit code and combined output.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to run."),
        cwd: z.string().optional().describe("Working directory."),
        timeoutSeconds: z.number().int().positive().max(300).optional(),
      }),
      execute: async ({ command, cwd, timeoutSeconds }) => {
        const box = await sandbox();
        const res = await box.process.executeCommand(
          command,
          cwd,
          undefined,
          timeoutSeconds ?? 60,
        );
        return { exitCode: res.exitCode, output: clip(res.result) };
      },
    }),

    read_file: tool({
      description: "Read a text file from your sandbox.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        const box = await sandbox();
        const buffer = await box.fs.downloadFile(path);
        return { path, content: clip(buffer.toString("utf-8")) };
      },
    }),

    write_file: tool({
      description:
        "Write a text file in your sandbox, replacing it if it exists.",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path, content }) => {
        const box = await sandbox();
        await box.fs.uploadFile(Buffer.from(content, "utf-8"), path);
        return { path, bytes: Buffer.byteLength(content) };
      },
    }),

    list_files: tool({
      description: "List the files and folders in a directory of your sandbox.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        const box = await sandbox();
        const files = await box.fs.listFiles(path);
        return {
          path,
          files: files.map((f) => ({
            name: f.name,
            isDir: f.isDir,
            size: f.size,
          })),
        };
      },
    }),

    mouse_click: tool({
      description: "Click the mouse at screen coordinates.",
      inputSchema: z.object({
        x: z.number().int(),
        y: z.number().int(),
        button: z.enum(["left", "right", "middle"]).optional(),
        double: z.boolean().optional().describe("Double click."),
      }),
      execute: async ({ x, y, button, double }) => {
        const computer = await desktop();
        await computer.mouse.click(x, y, button ?? "left", double ?? false);
        return { ok: true };
      },
    }),

    mouse_move: tool({
      description: "Move the mouse cursor to screen coordinates.",
      inputSchema: z.object({ x: z.number().int(), y: z.number().int() }),
      execute: async ({ x, y }) => {
        const computer = await desktop();
        await computer.mouse.move(x, y);
        return { ok: true };
      },
    }),

    mouse_scroll: tool({
      description: "Scroll the mouse wheel at screen coordinates.",
      inputSchema: z.object({
        x: z.number().int(),
        y: z.number().int(),
        direction: z.enum(["up", "down"]),
        amount: z.number().int().positive().max(50).optional(),
      }),
      execute: async ({ x, y, direction, amount }) => {
        const computer = await desktop();
        await computer.mouse.scroll(x, y, direction, amount ?? 3);
        return { ok: true };
      },
    }),

    keyboard_type: tool({
      description:
        "Type text with the keyboard. Newlines are typed as Enter. Use keyboard_press for other keys.",
      inputSchema: z.object({ text: z.string() }),
      execute: async ({ text }) => {
        const computer = await desktop();
        await computer.keyboard.type(text);
        return { ok: true };
      },
    }),

    keyboard_press: tool({
      description:
        "Press a key, optionally with modifiers (ctrl, alt, shift, cmd). Keys: enter, escape, tab, backspace, delete, space, arrows, home, end, pageup, pagedown, f1-f24, letters, digits.",
      inputSchema: z.object({
        key: z.string(),
        modifiers: z.array(z.enum(["ctrl", "alt", "shift", "cmd"])).optional(),
      }),
      execute: async ({ key, modifiers }) => {
        const computer = await desktop();
        await computer.keyboard.press(key, modifiers);
        return { ok: true };
      },
    }),

    view_screen: tool({
      description:
        "Take a screenshot of your desktop so YOU can see it. The user does not see this. Use it whenever you need to look at the screen, e.g. to find where to click or to check the result of an action.",
      inputSchema: z.object({}),
      execute: async () => screenshot(),
      // The model gets the image itself, not base64 text.
      toModelOutput: ({ output }) => ({
        type: "content",
        value: [
          {
            type: "file",
            mediaType: output.mediaType,
            data: { type: "data", data: output.base64 },
          },
        ],
      }),
    }),

    show_screen: tool({
      description:
        "Show the user a screenshot of your desktop in the chat. Use it when the user asks what is on the screen or wants to see it. You do not see the image yourself; use view_screen for that.",
      inputSchema: z.object({
        caption: z.string().optional().describe("Short note shown with it."),
      }),
      execute: async ({ caption }) => ({ ...(await screenshot()), caption }),
      toModelOutput: () => ({
        type: "text",
        value: "The screenshot was shown to the user.",
      }),
    }),
  };
}

export type SandboxTools = ReturnType<typeof createSandboxTools>;
