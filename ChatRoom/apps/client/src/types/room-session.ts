
import type { RoomSummary } from "@chatroom/shared";

interface BaseRoomSession {
  roomCode: string;
  participantId: string;
  displayName: string;
  room: RoomSummary;
  phase: "created" | "active" | "locked";
}

export interface CreatorRoomSession
  extends BaseRoomSession {
  role: "creator";
  creatorToken: string;
}

export interface MemberRoomSession
  extends BaseRoomSession {
  role: "member";
}

export type RoomSession =
  | CreatorRoomSession
  | MemberRoomSession;
