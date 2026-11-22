import { logger, task, wait } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { name?: string }) => {
    const name = payload.name ?? "world";
    logger.log(`Hello, ${name}!`);

    await wait.for({ seconds: 5 });

    return { message: `Hello, ${name}!` };
  },
});
