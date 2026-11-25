const AUTHOR_URL = "https://borhan1997.github.io/";

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t px-4 py-8 text-center text-base text-muted-foreground sm:px-6">
      <span>Crewmate, an open exploration of AI coworkers.</span>
      <span>
        Built by{" "}
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-foreground italic underline-offset-4 hover:underline"
        >
          Borhan Hleiss
        </a>
      </span>
    </footer>
  );
}
