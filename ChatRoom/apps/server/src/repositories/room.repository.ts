
import type {
  Participant,
  RoomMessage,
  RoomStatus,
} from "@chatroom/shared";

import type {
  RoomRecord,
} from "./room-record.js";

export interface CreateRoomRecordInput {
  code: string;
  creatorId: string;
  creatorTokenHash: string;
  maxParticipants: number;
  createdAt: string;
}

export interface RoomRepository {
  create(input: CreateRoomRecordInput): RoomRecord;

  findByCode(code: string): RoomRecord | null;

  exists(code: string): boolean;

  findAll(): RoomRecord[];

  updateStatus(
    code: string,
    status: RoomStatus,
    changedAt?: string,
  ): RoomRecord | null;

  updateEmptySince(
    code: string,
    emptySince: string | null,
  ): RoomRecord | null;

  addParticipant(
    code: string,
    participant: Participant,
  ): Participant | null;

  findParticipant(
    code: string,
    participantId: string,
  ): Participant | null;

  updateParticipant(
    code: string,
    participantId: string,
    updates: Partial<
      Pick<Participant, "displayName" | "isConnected">
    >,
  ): Participant | null;

  removeParticipant(
    code: string,
    participantId: string,
  ): boolean;

  addMessage(
    code: string,
    message: RoomMessage,
  ): RoomMessage | null;

  getMessages(code: string): RoomMessage[];

  delete(code: string): boolean;

  clear(): void;

  count(): number;
}
