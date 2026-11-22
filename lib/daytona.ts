import { Daytona } from "@daytona/sdk";

// DAYTONA_API_URL points at the v0 API, so use the SDK's v0 client.
const daytona = new Daytona();

/** Creates a sandbox for a bot and returns its id. Does not use it. */
export async function createSandbox(botId: string) {
  const sandbox = await daytona.v0.create({ labels: { botId } });
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
