import { Daytona } from "@daytona/sdk";

// DAYTONA_API_URL points at the v0 API, so use the SDK's v0 client.
const daytona = new Daytona();

/** Where a bot keeps its long-term memory. Shared by every chat the bot is in. */
export const MEMORY_PATH = "/home/daytona/MEMORY.md";

/** Creates a sandbox for a bot, with a blank memory file, and returns its id. */
export async function createSandbox(botId: string) {
  const sandbox = await daytona.v0.create({ labels: { botId } });
  try {
    await sandbox.fs.uploadFile(Buffer.alloc(0), MEMORY_PATH);
  } catch (error) {
    // Don't leak a sandbox the caller never learns the id of.
    await daytona.v0.delete(sandbox).catch(() => {});
    throw error;
  }
  return sandbox.id;
}

/** Permanently deletes a bot's sandbox. */
export async function deleteSandbox(sandboxId: string) {
  const sandbox = await daytona.v0.get(sandboxId);
  await daytona.v0.delete(sandbox);
}

/** Returns a started sandbox, starting it first if it is stopped. */
export async function getStartedSandbox(sandboxId: string) {
  const sandbox = await daytona.v0.get(sandboxId);
  if (sandbox.state !== "started") await sandbox.start();
  return sandbox;
}
