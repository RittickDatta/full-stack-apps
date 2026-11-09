
import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { RoomMessage } from "@chatroom/shared";

import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatMessageListProps {
  messages: RoomMessage[];
  participantId: string;
}

export function ChatMessageList({
  messages,
  participantId,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageIdsRef = useRef<Set<string> | null>(
    null,
  );

  const [announcement, setAnnouncement] = useState("");

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    shouldAutoScrollRef.current =
      distanceFromBottom < 100;
  }

  useEffect(() => {
    const element = listRef.current;

    if (!element || !shouldAutoScrollRef.current) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "auto"
        : "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const currentIds = new Set(
      messages.map((message) => message.id),
    );

    const previousIds = previousMessageIdsRef.current;
    previousMessageIdsRef.current = currentIds;

    // Don't announce the initial history as new messages.
    if (previousIds === null) return;

    const newMessages = messages.filter(
      (message) => !previousIds.has(message.id),
    );

    if (newMessages.length === 0) return;

    const lastMessage = newMessages.at(-1);

    if (!lastMessage) return;

    if (lastMessage.senderId === participantId) {
      return;
    }

    setAnnouncement(
      newMessages.length > 1
        ? `${newMessages.length} new messages`
        : lastMessage.type === "system"
          ? lastMessage.content
          : `${lastMessage.senderName ?? "Participant"}: ${lastMessage.content}`,
    );
  }, [messages, participantId]);

  return (
    <>
      <ul
        ref={listRef}
        onScroll={handleScroll}
        aria-label="Room messages"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 0 ? (
          <li className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No messages yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Be the first to say hello!
            </p>
          </li>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isOwnMessage={
                message.senderId === participantId
              }
            />
          ))
        )}
      </ul>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </>
  );
}
