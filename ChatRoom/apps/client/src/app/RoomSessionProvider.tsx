import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { socket } from "../lib/socket";
import { ensureSocketConnected } from "../lib/socket-connection";

import type { RoomSession } from "../types/room-session";

import { getRoomErrorMessage } from "../lib/room-errors";

interface RoomSessionContextValue {
  session: RoomSession | null;
  isBusy: boolean;
  error: string | null;

  createRoom: (displayName: string) => Promise<string | null>;

  joinRoom: (roomCode: string, displayName: string) => Promise<string | null>;

  startRoom: () => Promise<boolean>;
  clearError: () => void;
  lockRoom: () => Promise<boolean>;
  closeRoom: () => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
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
  const [session, setSession] = useState<RoomSession | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const activeRoomCodeRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  useEffect(() => {
    activeRoomCodeRef.current = session?.roomCode ?? null;
  }, [session]);

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

  useEffect(() => {
    const onRoomUpdated = (
      event: Parameters<
        import("@chatroom/shared").ServerToClientEvents["room:updated"]
      >[0],
    ) => {
      setSession((current) => {
        if (!current || current.roomCode !== event.room.code) {
          return current;
        }

        const status = event.room.status;

        // A closed room is no longer a valid session.
        if (status === "closed") {
          return null;
        }

        return {
          ...current,
          room: event.room,
          phase:
            status === "locked"
              ? "locked"
              : status === "created"
                ? "created"
                : "active",
        };
      });
    };

    socket.on("room:updated", onRoomUpdated);

    return () => {
      socket.off("room:updated", onRoomUpdated);
    };
  }, []);

  useEffect(() => {
    const onRoomClosed = (
      event: Parameters<
        import("@chatroom/shared").ServerToClientEvents["room:closed"]
      >[0],
    ) => {
      if (activeRoomCodeRef.current !== event.roomCode) {
        return;
      }
      setSession((current) => {
        if (current?.roomCode !== event.roomCode) {
          return current;
        }

        return null;
      });

      // Use the reason supplied by the backend.
      setSessionNotice(
        `Room ${event.roomCode} was closed. Reason: ${event.reason}`,
      );
    };

    socket.on("room:closed", onRoomClosed);

    return () => {
      socket.off("room:closed", onRoomClosed);
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

        setSessionNotice(null);

        if (!socket.connected) {
          setError(
            "Connection was lost while creating the room. Please try again.",
          );
          return null;
        }

        setSession({
          role: "creator",
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
    if (!session || session.role !== "creator" || isBusy) {
      setError("Only the room creator can start this room.");
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
        current?.role === "creator"
          ? {
              ...current,
              room: {
                ...current.room,
                ...result.data.room,
              },
              phase: "active",
            }
          : current,
      );

      return true;
    } catch (error) {
      setError(errorMessage(error, "Unable to start the room."));
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [session, isBusy]);

  const joinRoom = useCallback(
    async (roomCode: string, displayName: string): Promise<string | null> => {
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

      const normalizedCode = roomCode.trim().toUpperCase();

      try {
        await ensureSocketConnected();

        const result = await socket.timeout(10000).emitWithAck("room:join", {
          roomCode: normalizedCode,
          displayName: displayName.trim(),
        });

        if (!result.success) {
          setError(
            getRoomErrorMessage(result.error.code, result.error.message),
          );
          return null;
        }

        if (!socket.connected) {
          setError(
            "Connection was lost while joining the room. Please try again.",
          );
          return null;
        }

        const joined = result.data;
        
        setSessionNotice(null);

        setSession({
          role: "member",
          roomCode: joined.room.code,
          participantId: joined.participantId,
          displayName: displayName.trim(),
          room: joined.room,
          phase: joined.room.status === "locked" ? "locked" : "active",
        });

        return joined.room.code;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to join the room.",
        );
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, session],
  );

  const lockRoom = useCallback(async (): Promise<boolean> => {
    if (!session || session.role !== "creator") {
      setError("Only the room creator can lock this room.");
      return false;
    }

    if (session.room.status !== "active") {
      setError("Only an active room can be locked.");
      return false;
    }

    if (isBusy) return false;

    if (!socket.connected) {
      setError("Connection lost. Please create a new room.");
      return false;
    }

    setIsBusy(true);
    setError(null);

    const connectionId = socket.id;

    try {
      const result = await socket.timeout(10000).emitWithAck("room:lock", {
        roomCode: session.roomCode,
        creatorToken: session.creatorToken,
      });

      if (!socket.connected || socket.id !== connectionId) {
        setError("Connection changed while locking the room.");
        return false;
      }

      if (!result.success) {
        setError(result.error.message);
        return false;
      }

      setSession((current) =>
        current?.roomCode === session.roomCode
          ? {
              ...current,
              room: {
                ...current.room,
                ...result.data,
              },
              phase: "locked",
            }
          : current,
      );

      return true;
    } catch {
      setError("Unable to lock the room. Please try again.");
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [session, isBusy]);

  const closeRoom = useCallback(async (): Promise<boolean> => {
    if (!session || session.role !== "creator") {
      setError("Only the room creator can close this room.");
      return false;
    }

    if (isBusy) return false;

    if (!socket.connected) {
      setError("Connection lost. Unable to close the room.");
      return false;
    }

    setIsBusy(true);
    setError(null);

    const connectionId = socket.id;

    try {
      const result = await socket.timeout(10000).emitWithAck("room:close", {
        roomCode: session.roomCode,
        creatorToken: session.creatorToken,
      });

      if (!socket.connected || socket.id !== connectionId) {
        setError("Connection changed while closing the room.");
        return false;
      }

      if (!result.success) {
        setError(result.error.message);
        return false;
      }

      setSessionNotice("You closed the room.");
      setSession(null);
      setError(null);

      return true;
    } catch {
      setError("Unable to close the room. Please try again.");
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [session, isBusy]);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!session) {
      setError("You are not currently in a room.");
      return false;
    }

    if (isBusy) return false;

    if (!socket.connected) {
      setError("Connection lost. Unable to leave the room.");
      return false;
    }

    setIsBusy(true);
    setError(null);

    const connectionId = socket.id;

    try {
      const result = await socket.timeout(10000).emitWithAck("room:leave", {
        roomCode: session.roomCode,
      });

      if (!socket.connected || socket.id !== connectionId) {
        setError("Connection changed while leaving the room.");
        return false;
      }

      if (!result.success) {
        setError(result.error.message);
        return false;
      }

      setSessionNotice("You left the room.");
      setSession(null);
      setError(null);

      return true;
    } catch {
      setError("Unable to leave the room. Please try again.");
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
      joinRoom,
      clearError,
      lockRoom,
      leaveRoom,
      closeRoom,
      sessionNotice,
      clearSessionNotice,
    }),
    [
      session,
      isBusy,
      error,
      createRoom,
      startRoom,
      joinRoom,
      clearError,
      lockRoom,
      closeRoom,
      leaveRoom,
      sessionNotice,
      clearSessionNotice,
    ],
  );

  return (
    <RoomSessionContext.Provider value={value}>
      {children}
    </RoomSessionContext.Provider>
  );
}
