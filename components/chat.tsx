"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react";

import {
  loadTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat";
import type { crewmateChat } from "@/trigger/chat";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

const sessionKey = (chatId: string) => `crewmate-session:${chatId}`;

// The transport's per-chat session state (run, resume cursor) lives in the
// browser so a refresh mid-answer can reconnect to the running turn.
function loadSessions(chatId: string) {
  try {
    const saved = localStorage.getItem(sessionKey(chatId));
    return saved ? { [chatId]: JSON.parse(saved) } : undefined;
  } catch {
    return undefined;
  }
}

export function Chat({ chatId }: { chatId: string }) {
  const transport = useTriggerChatTransport<typeof crewmateChat>({
    task: "crewmate-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) =>
      startChatSession({ chatId, clientData }),
    sessions: loadSessions(chatId),
    onSessionChange: (id, session) => {
      try {
        if (session) {
          localStorage.setItem(sessionKey(id), JSON.stringify(session));
        } else {
          localStorage.removeItem(sessionKey(id));
        }
      } catch {}
    },
  });
  const { messages, isLoading } = useLoadTranscript(chatId, loadTranscript, {
    transport,
  });
  if (isLoading) return <div className="min-h-0 flex-1" />;

  return (
    <ChatView
      chatId={chatId}
      initialMessages={messages}
      transport={transport}
    />
  );
}

function ChatView({
  chatId,
  initialMessages,
  transport,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  transport: ReturnType<typeof useTriggerChatTransport<typeof crewmateChat>>;
}) {
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  });

  function handleSubmit({ text }: PromptInputMessage) {
    if (!text.trim()) return;
    sendMessage({ text });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={`${message.id}-${i}`}>
                      {part.text}
                    </MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Send a message..." />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
