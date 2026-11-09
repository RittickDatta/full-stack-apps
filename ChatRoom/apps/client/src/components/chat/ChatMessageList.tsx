
import {
  useEffect,
  useRef,
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
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <ul
      ref={listRef}
      onScroll={handleScroll}
      aria-label="Room messages"
      aria-live="polite"
      aria-relevant="additions"
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
  );
}
