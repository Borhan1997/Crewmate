import { cn } from "@/lib/utils";

type FeatureProps = {
  title: string;
  body: string;
  reverse?: boolean;
  children: React.ReactNode;
};

export function Feature({ title, body, reverse, children }: FeatureProps) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
      <div className={cn("flex flex-col gap-4", reverse && "md:order-2")}>
        <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground">{body}</p>
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:p-6",
          reverse && "md:order-1",
        )}
      >
        {children}
      </div>
    </section>
  );
}
