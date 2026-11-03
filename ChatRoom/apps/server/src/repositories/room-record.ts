
import type {
  Participant,
  RoomMessage,
  RoomStatus,
  RoomSummary,
  RoomSnapshot,
} from "@chatroom/shared";

export interface RoomRecord {
  code: string;
  status: RoomStatus;

  creatorId: string;
  creatorTokenHash: string;

  maxParticipants: number;

  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;

  participants: Map<string, Participant>;
  messages: RoomMessage[];
}

export function toRoomSummary(
  room: RoomRecord,
): RoomSummary {
  return {
    code: room.code,
    status: room.status,
    participantCount: room.participants.size,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
  };
}

export function toRoomSnapshot(
  room: RoomRecord,
): RoomSnapshot {
  return {
    ...toRoomSummary(room),
    participants: Array.from(
      room.participants.values(),
      (participant) => ({ ...participant }),
    ),
    messages: room.messages.map(
      (message) => ({ ...message }),
    ),
  };
}
