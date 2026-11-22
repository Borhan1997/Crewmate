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
import { getChat } from "@/queries/chats";

export default async function Page(props: PageProps<"/chats/[chatId]">) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  const { chatId } = await props.params;
  const chat = await getChat(chatId);
  if (!chat) notFound();

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
            <main className="flex h-full min-h-0 flex-col">
              <ChatHeader chat={chat} />
              <Chat chatId={chatId} />
            </main>
          </ResizablePanel>
          <SidePanelHandle name="desktop" />
          <SidePanel name="desktop">
            <DesktopPreview name={chat.bot.name} />
          </SidePanel>
        </ResizablePanelGroup>
      </DesktopProvider>
    </SidePanelProvider>
  );
}
