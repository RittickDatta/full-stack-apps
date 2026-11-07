
import type {
  Participant,
} from "./participant.js";

import type {
  RoomMessage,
} from "./message.js";

import type {
  ROOM_STATES,
} from "./constants.js";

export type RoomStatus =
  (typeof ROOM_STATES)[number];

export interface RoomSummary {
  code: string;
  status: RoomStatus;
  participantCount: number;
  maxParticipants: number;
  createdAt: string;
  startedAt: string | null;
}

export interface RoomSnapshot extends RoomSummary {
  participants: Participant[];
  messages: RoomMessage[];
}

export interface CreateRoomResult {
  room: RoomSummary;
  creatorToken: string;
  participantId: string;
}

export interface JoinRoomResult {
  room: RoomSnapshot;
  participantId: string;
}

export interface StartRoomResult {
  room: RoomSnapshot;
  participantId: string;
}
