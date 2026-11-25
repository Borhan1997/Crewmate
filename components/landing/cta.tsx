import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export const GITHUB_URL = "https://github.com/Borhan1997/Crewmate";

export function Cta() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
        Get started
      </Link>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        View on GitHub
        <ArrowUpRightIcon data-icon="inline-end" />
      </a>
    </div>
  );
}
