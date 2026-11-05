import { MAX_PARTICIPANTS, assertRoomTransition } from "@chatroom/shared";

import type { Participant, RoomMessage, RoomStatus } from "@chatroom/shared";

import type {
  CreateRoomRecordInput,
  RoomRepository,
} from "./room.repository.js";

import type { RoomRecord } from "./room-record.js";

export class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, RoomRecord>();

  private cloneRoom(room: RoomRecord): RoomRecord {
    return {
      ...room,
      participants: new Map(
        Array.from(room.participants, ([id, participant]) => [
          id,
          { ...participant },
        ]),
      ),
      messages: room.messages.map((message) => ({ ...message })),
    };
  }

  create(input: CreateRoomRecordInput): RoomRecord {
    const code = input.code.toUpperCase();

    if (this.rooms.has(code)) {
      throw new Error(`Room with code ${code} already exists.`);
    }

    if (
      !Number.isInteger(input.maxParticipants) ||
      input.maxParticipants < 1 ||
      input.maxParticipants > MAX_PARTICIPANTS
    ) {
      throw new Error("Invalid room capacity.");
    }

    const room: RoomRecord = {
      code,
      status: "created",

      creatorId: input.creatorId,
      creatorTokenHash: input.creatorTokenHash,

      maxParticipants: input.maxParticipants,

      createdAt: input.createdAt,
      startedAt: null,
      closedAt: null,
      emptySince: null,

      participants: new Map(),
      messages: [],
    };

    this.rooms.set(code, room);

    return this.cloneRoom(room);
  }

  findByCode(code: string): RoomRecord | null {
    const room = this.rooms.get(code.toUpperCase());

    return room ? this.cloneRoom(room) : null;
  }

  exists(code: string): boolean {
    return this.rooms.has(code.toUpperCase());
  }

  findAll(): RoomRecord[] {
    return Array.from(this.rooms.values(), (room) => this.cloneRoom(room));
  }

  updateStatus(
    code: string,
    status: RoomStatus,
    changedAt = new Date().toISOString(),
  ): RoomRecord | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    assertRoomTransition(room.status, status);

    room.status = status;

    if (status === "active") {
      room.startedAt = changedAt;
    }

    if (status === "closed") {
      room.closedAt = changedAt;
    }

    return this.cloneRoom(room);
  }

  updateEmptySince(
    code: string,
    emptySince: string | null,
  ): RoomRecord | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    room.emptySince = emptySince;

    return this.cloneRoom(room);
  }

  addParticipant(code: string, participant: Participant): Participant | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    const isCreatorInitialization =
      room.status === "created" &&
      participant.role === "creator" &&
      participant.id === room.creatorId &&
      room.participants.size === 0;

    const isMemberJoining =
      room.status === "active" && participant.role === "member";

    if (!isCreatorInitialization && !isMemberJoining) {
      throw new Error("Participants cannot join in this room state.");
    }

    if (room.participants.has(participant.id)) {
      throw new Error("Participant already exists.");
    }

    if (room.participants.size >= room.maxParticipants) {
      throw new Error("Room is full.");
    }

    room.participants.set(participant.id, { ...participant });

    return { ...participant };
  }

  findParticipant(code: string, participantId: string): Participant | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    const participant = room.participants.get(participantId);

    return participant ? { ...participant } : null;
  }

  updateParticipant(
    code: string,
    participantId: string,
    updates: Partial<Pick<Participant, "displayName" | "isConnected">>,
  ): Participant | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    const participant = room.participants.get(participantId);

    if (!participant) return null;

    const updated: Participant = {
      ...participant,
      ...updates,
    };

    room.participants.set(participantId, updated);

    return { ...updated };
  }

  removeParticipant(code: string, participantId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return false;

    return room.participants.delete(participantId);
  }

  addMessage(code: string, message: RoomMessage): RoomMessage | null {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return null;

    if (room.status !== "active" && room.status !== "locked") {
      throw new Error("Messages are not allowed in this room state.");
    }

    if (message.roomCode !== room.code) {
      throw new Error("Message room code mismatch.");
    }

    room.messages.push({ ...message });

    return { ...message };
  }

  getMessages(code: string): RoomMessage[] {
    const room = this.rooms.get(code.toUpperCase());

    if (!room) return [];

    return room.messages.map((message) => ({ ...message }));
  }

  delete(code: string): boolean {
    return this.rooms.delete(code.toUpperCase());
  }

  clear(): void {
    this.rooms.clear();
  }

  count(): number {
    return this.rooms.size;
  }
}
