import type { AckResult } from "./errors.js";

import type { Participant } from "./participant.js";

import type { RoomMessage, SendMessagePayload } from "./message.js";

import type {
  CreateRoomResult,
  JoinRoomResult,
  RoomSnapshot,
  RoomSummary,
  StartRoomResult,
} from "./room.js";

export interface ConnectionInfo {
  socketId: string;
  connectedAt: string;
}

export interface PingAcknowledgement {
  success: true;
  message: string;
  receivedAt: string;
}

export interface CreateRoomPayload {
  displayName: string;
}

export interface StartRoomPayload {
  roomCode: string;
  creatorToken: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  displayName: string;
}

export interface LockRoomPayload {
  roomCode: string;
  creatorToken: string;
}

export interface LeaveRoomPayload {
  roomCode: string;
}

export interface CloseRoomPayload {
  roomCode: string;
  creatorToken: string;
}

export interface RoomUpdatedEvent {
  room: RoomSummary;
}

export interface RoomClosedEvent {
  roomCode: string;
  reason: "creator_closed" | "expired" | "empty";
}

export interface ParticipantEvent {
  roomCode: string;
  participant: Participant;
}

export interface ParticipantLeftEvent {
  roomCode: string;
  participantId: string;
  displayName: string;
}

export interface ServerToClientEvents {
  "connection:ready": (info: ConnectionInfo) => void;

  "chat:message": (message: RoomMessage) => void;

  "participant:joined": (event: ParticipantEvent) => void;

  "participant:left": (event: ParticipantLeftEvent) => void;

  "room:updated": (payload: { room: RoomSnapshot }) => void;

  "room:closed": (event: RoomClosedEvent) => void;
}

export interface ClientToServerEvents {
  "connection:ping": (
    payload: { message: string },
    acknowledge: (response: PingAcknowledgement) => void,
  ) => void;

  "room:create": (
    payload: CreateRoomPayload,
    acknowledge: (result: AckResult<CreateRoomResult>) => void,
  ) => void;

  "room:start": (
    payload: StartRoomPayload,
    acknowledge: (result: AckResult<StartRoomResult>) => void,
  ) => void;

  "room:join": (
    payload: JoinRoomPayload,
    acknowledge: (result: AckResult<JoinRoomResult>) => void,
  ) => void;

  "chat:send": (
    payload: SendMessagePayload,
    acknowledge: (result: AckResult<RoomMessage>) => void,
  ) => void;

  "room:lock": (
    payload: LockRoomPayload,
    acknowledge: (result: AckResult<RoomSummary>) => void,
  ) => void;

  "room:leave": (
    payload: LeaveRoomPayload,
    acknowledge: (result: AckResult<{ roomCode: string }>) => void,
  ) => void;

  "room:close": (
    payload: CloseRoomPayload,
    acknowledge: (result: AckResult<{ roomCode: string }>) => void,
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  participantId?: string;
  roomCode?: string;
  isCreator?: boolean;
}
