
import type {
  RoomSummary,
} from "@chatroom/shared";

export interface CreatorRoomSession {
  roomCode: string;
  participantId: string;
  displayName: string;
  creatorToken: string;
  room: RoomSummary;
  phase: "created" | "active";
}
