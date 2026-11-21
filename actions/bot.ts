"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { type BotInput, botInsertSchema, bots } from "@/db/schema";

export async function createBot(input: BotInput) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error("Unauthorized");

  const data = botInsertSchema.parse(input);

  const [bot] = await db
    .insert(bots)
    .values({ ...data, instructions: data.instructions || null, userId })
    .returning();

  revalidatePath("/");
  return bot;
}
