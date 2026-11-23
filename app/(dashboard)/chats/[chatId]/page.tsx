import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { DesktopPreview, DesktopProvider } from "@/components/desktop";
import { Chat } from "@/components/chat";
import { ChatHeader } from "@/components/chat-header";
import {
  SidePanel,
  SidePanelHandle,
  SidePanelProvider,
} from "@/components/side-panel";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { getBots } from "@/queries/bots";
import { getChat } from "@/queries/chats";

export default async function Page(props: PageProps<"/chats/[chatId]">) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  const { chatId } = await props.params;
  const [chat, bots] = await Promise.all([getChat(chatId), getBots()]);
  if (!chat) notFound();

  const chatView = (
    <main className="flex h-full min-h-0 flex-col">
      <ChatHeader chat={chat} bots={bots} />
      <Chat chatId={chatId} bots={chat.bots} isGroup={chat.kind === "group"} />
    </main>
  );

  // Group chats have no desktop, so no side panel either.
  if (chat.kind === "group") return <div className="h-svh">{chatView}</div>;

  return (
    <SidePanelProvider>
      <DesktopProvider chatId={chatId}>
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-svh overflow-hidden"
        >
          <ResizablePanel
            minSize="30%"
            className="h-svh min-w-0"
            style={{ overflow: "hidden" }}
          >
            {chatView}
          </ResizablePanel>
          <SidePanelHandle name="desktop" />
          <SidePanel name="desktop">
            <DesktopPreview name={chat.bots[0].name} />
          </SidePanel>
        </ResizablePanelGroup>
      </DesktopProvider>
    </SidePanelProvider>
  );
}
