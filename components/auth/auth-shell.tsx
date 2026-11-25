import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="Crewmate home">
        <Image src="/crewmate_head.svg" alt="" width={192} height={182} priority />
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        {children}
        <p className="text-center text-base text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
