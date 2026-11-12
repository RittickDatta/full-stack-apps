interface PreviewMessage {
  id: string;
  sender: string;
  content: string;
  isOwn: boolean;
}

const previewMessages: PreviewMessage[] = [
  {
    id: "1",
    sender: "Alice",
    content: "Hey everyone! Ready for Saturday?",
    isOwn: false,
  },
  {
    id: "2",
    sender: "Bob",
    content: "Absolutely! Let's make a plan.",
    isOwn: true,
  },
  {
    id: "3",
    sender: "Alice",
    content: "Perfect. I'll share the details here.",
    isOwn: false,
  },
];

export function ChatPreview() {
  return (
    <div
      role="img"
      aria-label="Illustration of a ChatRoom conversation between Alice and Bob"
      className="mx-auto w-full max-w-lg"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/60">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="font-semibold text-slate-900">Weekend Plans</p>

            <p className="mt-1 text-xs text-slate-500">
              Room A7K9PQ · 3 participants
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-green-500"
            />
            Preview
          </span>
        </div>

        <div className="space-y-5 px-5 py-7 sm:px-6">
          {previewMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isOwn ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.isOwn
                    ? "rounded-br-md bg-indigo-600 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-900"
                }`}
              >
                <p
                  className={`mb-1 text-xs font-semibold ${
                    message.isOwn ? "text-indigo-100" : "text-indigo-700"
                  }`}
                >
                  {message.sender}
                </p>

                <p className="text-sm leading-6">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
            <span>Type a message...</span>

            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"
            >
              ↑
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Illustrative preview — not a live conversation.
      </p>
    </div>
  );
}
