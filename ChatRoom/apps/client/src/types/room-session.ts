
import type {
  RoomSummary,
  RoomSnapshot,
} from "@chatroom/shared";

export type SessionRoom =
  RoomSummary | RoomSnapshot;

interface BaseRoomSession {
  roomCode: string;
  participantId: string;
  displayName: string;
  room: SessionRoom;
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
