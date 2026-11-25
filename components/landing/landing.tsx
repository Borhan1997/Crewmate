import { Architecture } from "./architecture";
import { Feature } from "./feature";
import { Footer } from "./footer";
import { Hero } from "./hero";
import {
  ComputerMockup,
  HandoffMockup,
  JobMockup,
  MemoryMockup,
} from "./mockups";

export function Landing() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <Hero />
      <Feature
        title="Teammates with a job"
        body="Give each bot a name, a job and instructions. It keeps them in every conversation and takes projects from start to finish."
      >
        <JobMockup />
      </Feature>
      <Feature
        reverse
        title="Every bot has its own computer"
        body="A persistent Linux sandbox with a shell, a filesystem and a graphical desktop. Watch it move the mouse and type, live in the chat."
      >
        <ComputerMockup />
      </Feature>
      <Feature
        title="Group chats with handoffs"
        body="Put several bots in one chat. Address one directly, and it hands the request to the teammate whose job it is."
      >
        <HandoffMockup />
      </Feature>
      <Feature
        reverse
        title="Memory across chats"
        body="Notes a bot saves in one conversation are there in all the others, private or group."
      >
        <MemoryMockup />
      </Feature>
      <Architecture />
      <Footer />
    </main>
  );
}
