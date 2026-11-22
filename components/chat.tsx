"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react";

import {
  loadTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat";
import { ChatAvatar } from "@/components/chat-avatar";
import { ToolCall, type ChatMessage } from "@/components/tool-call";
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
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
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

type ChatBot = { id: string; name: string; avatar: string };

export function Chat({
  chatId,
  bots,
  isGroup,
}: {
  chatId: string;
  bots: ChatBot[];
  isGroup: boolean;
}) {
  // Which bot answers the next message. Sent with every turn as client data.
  const [botId, setBotId] = useState(bots[0].id);
  const transport = useTriggerChatTransport<typeof crewmateChat>({
    task: "crewmate-chat",
    clientData: { botId },
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
      initialMessages={messages as ChatMessage[]}
      transport={transport}
      bots={isGroup ? bots : []}
      botId={botId}
      onBotChange={setBotId}
    />
  );
}

function ChatView({
  chatId,
  initialMessages,
  transport,
  bots,
  botId,
  onBotChange,
}: {
  bots: ChatBot[];
  botId: string;
  onBotChange: (botId: string) => void;
  chatId: string;
  initialMessages: ChatMessage[];
  transport: ReturnType<typeof useTriggerChatTransport<typeof crewmateChat>>;
}) {
  const { messages, sendMessage, status, stop } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
    // After a handoff the teammate is the one the user is now talking to.
    onFinish: ({ message }) => {
      const handoff = message.parts.findLast(
        (part) =>
          part.type === "tool-handoff" && part.state === "output-available",
      );
      if (
        handoff?.type === "tool-handoff" &&
        handoff.state === "output-available" &&
        handoff.output.ok
      ) {
        onBotChange(handoff.output.botId);
      }
    },
  });

  function handleSubmit({ text }: PromptInputMessage) {
    if (!text.trim()) return;
    sendMessage({ text });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.map((message) => {
            // A handoff stamps a new `data-bot` part, so a reply can hold the
            // words of several bots: split it into one section per bot.
            const sections: {
              author?: ChatBot;
              parts: ChatMessage["parts"];
            }[] = [{ parts: [] }];
            for (const part of message.parts) {
              if (part.type === "data-bot") {
                const author =
                  message.role === "assistant"
                    ? bots.find((bot) => bot.id === part.data.botId)
                    : undefined;
                if (sections.at(-1)!.parts.length === 0) {
                  sections.at(-1)!.author = author;
                } else {
                  sections.push({ author, parts: [] });
                }
              } else {
                sections.at(-1)!.parts.push(part);
              }
            }
            return (
              <Message from={message.role} key={message.id}>
                {sections.map(({ author, parts }, section) => (
                  <div key={section} className="flex flex-col gap-2">
                    {author && (
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ChatAvatar seed={author.avatar} className="size-6" />
                        {author.name}
                      </div>
                    )}
                    <MessageContent>
                      {parts.map((part, i) =>
                        part.type === "text" ? (
                          <MessageResponse
                            key={`${message.id}-${section}-${i}`}
                          >
                            {part.text}
                          </MessageResponse>
                        ) : (
                          <ToolCall
                            key={`${message.id}-${section}-${i}`}
                            part={part}
                          />
                        ),
                      )}
                    </MessageContent>
                  </div>
                ))}
              </Message>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Send a message..." />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            {bots.length > 0 && (
              <PromptInputTools className="mr-auto">
                <PromptInputSelect
                  value={botId}
                  onValueChange={(value) => value && onBotChange(String(value))}
                  items={bots.map((bot) => ({
                    value: bot.id,
                    label: bot.name,
                  }))}
                >
                  <PromptInputSelectTrigger aria-label="Bot to talk to">
                    <PromptInputSelectValue>
                      {(value: string) => {
                        const bot = bots.find((b) => b.id === value);
                        return bot ? (
                          <>
                            <ChatAvatar seed={bot.avatar} className="size-5" />
                            {bot.name}
                          </>
                        ) : null;
                      }}
                    </PromptInputSelectValue>
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {bots.map((bot) => (
                      <PromptInputSelectItem key={bot.id} value={bot.id}>
                        <ChatAvatar seed={bot.avatar} className="size-5" />
                        {bot.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
            )}
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
