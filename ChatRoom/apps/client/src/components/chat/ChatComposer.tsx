import { useState, type FormEvent, type KeyboardEvent } from "react";

import { MAX_MESSAGE_LENGTH } from "@chatroom/shared";

import { Button } from "../ui/Button";

interface ChatComposerProps {
  onSend: (content: string) => Promise<boolean>;
  isSending: boolean;
  disabled: boolean;
  error: string | null;
  clearError: () => void;
}

export function ChatComposer({
  onSend,
  isSending,
  disabled,
  error,
  clearError,
}: ChatComposerProps) {
  const [content, setContent] = useState("");

  const trimmedContent = content.trim();
  const isOverLimit = trimmedContent.length > MAX_MESSAGE_LENGTH;

  const canSend =
    !disabled && !isSending && trimmedContent.length > 0 && !isOverLimit;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) return;

    const sent = await onSend(trimmedContent);

    if (sent) {
      setContent("");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();

      if (canSend) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="border-t border-slate-200 bg-white p-4 sm:p-5"
    >
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="chat-message" className="sr-only">
            Your message
          </label>

          <textarea
            id="chat-message"
            rows={2}
            value={content}
            disabled={disabled || isSending}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={
              disabled ? "Chat is unavailable" : "Type your message..."
            }
            onChange={(event) => {
              setContent(event.target.value);
              clearError();
            }}
            onKeyDown={handleKeyDown}
            className="max-h-40 min-h-12 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
            aria-describedby="chat-composer-help chat-character-count"
            aria-invalid={isOverLimit}
          />
        </div>

        <Button type="submit" disabled={!canSend} className="min-h-12">
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <span id="chat-composer-help">
          Enter to send. Shift+Enter for a new line.
        </span>

        <span
          id="chat-character-count"
          className={
            isOverLimit ? "font-semibold text-red-700" : "text-slate-500"
          }
        >
          {content.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </form>
  );
}
