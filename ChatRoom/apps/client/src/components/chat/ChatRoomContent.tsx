
import { useEffect, useState } from "react";

import type { RoomSession } from "../../types/room-session";

import { socket } from "../../lib/socket";
import { useRoomMessages } from "../../hooks/useRoomMessages";

import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

interface ChatRoomContentProps {
  session: RoomSession;
}

export function ChatRoomContent({
  session,
}: ChatRoomContentProps) {
  const [isConnected, setIsConnected] =
    useState(socket.connected);

  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearError,
  } = useRoomMessages();

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const canChat =
    isConnected &&
    (session.room.status === "active" ||
      session.room.status === "locked");

  return (
    <div className="flex h-[min(80vh,800px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatHeader
        room={session.room}
        isConnected={isConnected}
        displayName={session.displayName}
      />

      <ChatMessageList
        messages={messages}
        participantId={session.participantId}
      />

      <ChatComposer
        onSend={sendMessage}
        isSending={isSending}
        disabled={!canChat}
        error={error}
        clearError={clearError}
      />
    </div>
  );
}
