
import type { RoomMessage } from "@chatroom/shared";

import { formatMessageTime } from "../../lib/chat-utils";

interface ChatMessageBubbleProps {
  message: RoomMessage;
  isOwnMessage: boolean;
}

export function ChatMessageBubble({
  message,
  isOwnMessage,
}: ChatMessageBubbleProps) {
  if (message.type === "system") {
    return (
      <li className="flex justify-center py-2">
        <p className="max-w-md rounded-full bg-slate-100 px-4 py-2 text-center text-xs text-slate-600">
          {message.content}
        </p>
      </li>
    );
  }

  return (
    <li
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div
          className={`mb-1 flex items-center gap-2 text-xs ${
            isOwnMessage
              ? "justify-end text-slate-500"
              : "text-slate-500"
          }`}
        >
          <span className="font-semibold">
            {isOwnMessage
              ? "You"
              : message.senderName ?? "Unknown"}
          </span>

          <time dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwnMessage
              ? "rounded-br-md bg-indigo-600 text-white"
              : "rounded-bl-md bg-slate-100 text-slate-900"
          }`}
        >
          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
            {message.content}
          </p>
        </div>
      </div>
    </li>
  );
}
