import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Landing } from "@/components/landing/landing";

export default async function Page() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect("/home");

  return <Landing />;
}
