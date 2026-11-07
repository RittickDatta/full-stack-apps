import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { socket } from "../lib/socket";
import { ensureSocketConnected } from "../lib/socket-connection";

import type { CreatorRoomSession } from "../types/room-session";

interface RoomSessionContextValue {
  session: CreatorRoomSession | null;
  isBusy: boolean;
  error: string | null;
  createRoom: (displayName: string) => Promise<string | null>;
  startRoom: () => Promise<boolean>;
  clearError: () => void;
}

export const RoomSessionContext = createContext<RoomSessionContextValue | null>(
  null,
);

interface RoomSessionProviderProps {
  children: ReactNode;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function RoomSessionProvider({ children }: RoomSessionProviderProps) {
  const [session, setSession] = useState<CreatorRoomSession | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const onDisconnect = () => {
      setSession((current) => {
        if (!current) return null;

        // Our backend does not restore socket membership
        // automatically after reconnection.
        setError("Connection lost. Your room session must be recreated.");

        return null;
      });
    };

    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const createRoom = useCallback(
    async (displayName: string): Promise<string | null> => {
      if (isBusy || session) {
        setError(
          session
            ? "You already have a room session."
            : "Please wait for the current request.",
        );
        return null;
      }

      setIsBusy(true);
      setError(null);

      try {
        await ensureSocketConnected();

        const result = await socket.timeout(10000).emitWithAck("room:create", {
          displayName,
        });

        if (!result.success) {
          setError(result.error.message);
          return null;
        }

        const created = result.data;

        if (!socket.connected) {
          setError(
            "Connection was lost while creating the room. Please try again.",
          );
          return null;
        }

        setSession({
          roomCode: created.room.code,
          participantId: created.participantId,
          displayName,
          creatorToken: created.creatorToken,
          room: created.room,
          phase: "created",
        });

        return created.room.code;
      } catch (error) {
        setError(errorMessage(error, "Unable to create the room."));
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, session],
  );

  const startRoom = useCallback(async (): Promise<boolean> => {
    if (!session || isBusy) {
      setError("No room is ready to start.");
      return false;
    }

    if (!socket.connected) {
      setError("The connection was lost. Please create a new room.");
      return false;
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await socket.timeout(10000).emitWithAck("room:start", {
        roomCode: session.roomCode,
        creatorToken: session.creatorToken,
      });

      if (!result.success) {
        setError(result.error.message);
        return false;
      }

      if (!socket.connected) {
        setError("Connection was lost while starting the room.");
        setSession(null);
        return false;
      }

      setSession((current) =>
        current
          ? {
              ...current,
              room: {
                ...current.room,
                ...result.data.room,
              },
              phase: "active",
            }
          : null,
      );

      return true;
    } catch (error) {
      setError(errorMessage(error, "Unable to start the room."));
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [session, isBusy]);

  const value = useMemo(
    () => ({
      session,
      isBusy,
      error,
      createRoom,
      startRoom,
      clearError,
    }),
    [session, isBusy, error, createRoom, startRoom, clearError],
  );

  return (
    <RoomSessionContext.Provider value={value}>
      {children}
    </RoomSessionContext.Provider>
  );
}
