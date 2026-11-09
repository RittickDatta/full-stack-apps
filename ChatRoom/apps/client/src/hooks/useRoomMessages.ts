import { useCallback, useEffect, useState, useRef } from "react";

import type { RoomMessage } from "@chatroom/shared";

import { socket } from "../lib/socket";
import { appendUniqueMessage, getRoomMessages } from "../lib/chat-utils";
import { useRoomSession } from "./useRoomSession";

export function useRoomMessages() {
  const { session } = useRoomSession();

  const roomCode = session?.roomCode ?? null;
  const room = session?.room;

  const sendingRef = useRef(false);

  const [messages, setMessages] = useState<RoomMessage[]>(() =>
    room ? getRoomMessages(room) : [],
  );

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize messages when the server supplies a snapshot.
  useEffect(() => {
    if (!roomCode || !room) {
      setMessages([]);
      return;
    }

    const snapshotMessages = getRoomMessages(room);

    setMessages((current) => {
      const merged = [...snapshotMessages];

      for (const message of current) {
        if (!merged.some((item) => item.id === message.id)) {
          merged.push(message);
        }
      }

      return merged;
    });
  }, [roomCode, room]);

  // Listen for live messages.
  useEffect(() => {
    if (!roomCode) return;

    const onMessage = (message: RoomMessage) => {
      setMessages((current) => appendUniqueMessage(current, message));
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [roomCode]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (sendingRef.current) {
        return false;
      }

      if (!roomCode || !session) {
        setError("You are not in a room.");
        return false;
      }

      if (!socket.connected) {
        setError("Connection lost. Please reconnect.");
        return false;
      }

      if (
        session.room.status !== "active" &&
        session.room.status !== "locked"
      ) {
        setError("This room is not accepting messages.");
        return false;
      }

      const normalizedContent = content.trim();

      if (!normalizedContent) {
        setError("Enter a message before sending.");
        return false;
      }

      sendingRef.current = true;
      setIsSending(true);
      setError(null);

      try {
        const result = await socket.timeout(10000).emitWithAck("chat:send", {
          roomCode,
          content: normalizedContent,
        });

        if (!result.success) {
          setError(result.error.message);
          return false;
        }

        // The backend also broadcasts chat:message.
        // Deduplicate using the server-generated ID.
        setMessages((current) => appendUniqueMessage(current, result.data));

        return true;
      } catch {
        setError("Unable to send the message. Please try again.");
        return false;
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [roomCode, session],
  );

  return {
    messages,
    isSending,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
}
