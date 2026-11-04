import { randomUUID } from "node:crypto";

import {
  MAX_PARTICIPANTS,
  canStartRoom,
  createRoomSchema,
  startRoomSchema,
  joinRoomSchema,
  canJoinRoom,
  canSendMessage,
  sendMessageSchema,
} from "@chatroom/shared";

import type {
  AckResult,
  CreateRoomResult,
  Participant,
  StartRoomResult,
  JoinRoomResult,
  RoomMessage,
} from "@chatroom/shared";

import type { RoomRepository } from "../repositories/room.repository.js";

import { toRoomSnapshot, toRoomSummary } from "../repositories/room-record.js";

import { generateRoomCode } from "./room-code.js";

import {
  generateCreatorToken,
  hashCreatorToken,
  verifyCreatorToken,
} from "./creator-token.js";

const MAX_CODE_GENERATION_ATTEMPTS = 10;

export class RoomService {
  constructor(private readonly repository: RoomRepository) {}

  createRoom(input: unknown): AckResult<CreateRoomResult> {
    const parsed = createRoomSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Please enter a valid display name.",
        },
      };
    }

    const { displayName } = parsed.data;

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = generateRoomCode();

      if (this.repository.exists(code)) {
        continue;
      }

      const creatorId = randomUUID();
      const creatorToken = generateCreatorToken();
      const creatorTokenHash = hashCreatorToken(creatorToken);

      const createdAt = new Date().toISOString();

      const creator: Participant = {
        id: creatorId,
        displayName,
        role: "creator",
        joinedAt: createdAt,
        isConnected: true,
      };

      let roomCreated = false;

      try {
        this.repository.create({
          code,
          creatorId,
          creatorTokenHash,
          maxParticipants: MAX_PARTICIPANTS,
          createdAt,
        });

        roomCreated = true;

        const addedCreator = this.repository.addParticipant(code, creator);

        if (!addedCreator) {
          throw new Error("Failed to initialize room creator.");
        }

        const room = this.repository.findByCode(code);

        if (!room) {
          throw new Error("Newly created room could not be found.");
        }

        return {
          success: true,
          data: {
            room: toRoomSummary(room),
            creatorToken,
          },
        };
      } catch (error) {
        if (roomCreated) {
          this.repository.delete(code);
        }

        throw error;
      }
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to create a unique room. Please try again.",
      },
    };
  }

  startRoom(input: unknown): AckResult<StartRoomResult> {
    const parsed = startRoomSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Invalid room start request.",
        },
      };
    }

    const { roomCode, creatorToken } = parsed.data;

    const room = this.repository.findByCode(roomCode);

    if (!room) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    const isAuthorized = verifyCreatorToken(
      creatorToken,
      room.creatorTokenHash,
    );

    if (!isAuthorized) {
      return {
        success: false,
        error: {
          code: "NOT_AUTHORIZED",
          message: "Invalid creator credentials.",
        },
      };
    }

    if (!canStartRoom(room.status)) {
      return {
        success: false,
        error: {
          code: room.status === "closed" ? "ROOM_CLOSED" : "ALREADY_STARTED",
          message:
            room.status === "closed"
              ? "This room is closed."
              : "This room has already been started.",
        },
      };
    }

    const updatedRoom = this.repository.updateStatus(roomCode, "active");

    if (!updatedRoom) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    return {
      success: true,
      data: {
        room: toRoomSnapshot(updatedRoom),
        participantId: updatedRoom.creatorId,
      },
    };
  }

  joinRoom(input: unknown): AckResult<JoinRoomResult> {
    const parsed = joinRoomSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Invalid room code or display name.",
        },
      };
    }

    const { roomCode, displayName } = parsed.data;

    const room = this.repository.findByCode(roomCode);

    if (!room) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    if (room.status === "closed") {
      return {
        success: false,
        error: {
          code: "ROOM_CLOSED",
          message: "This room has been closed.",
        },
      };
    }

    if (room.status === "locked") {
      return {
        success: false,
        error: {
          code: "ROOM_LOCKED",
          message: "This room is locked.",
        },
      };
    }

    if (!canJoinRoom(room.status)) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_ACTIVE",
          message: "This room has not started yet.",
        },
      };
    }

    if (room.participants.size >= room.maxParticipants) {
      return {
        success: false,
        error: {
          code: "ROOM_FULL",
          message: "This room has reached its capacity.",
        },
      };
    }

    const participant: Participant = {
      id: randomUUID(),
      displayName,
      role: "member",
      joinedAt: new Date().toISOString(),
      isConnected: true,
    };

    let addedParticipant: Participant | null;

    try {
      addedParticipant = this.repository.addParticipant(roomCode, participant);
    } catch (error) {
      if (error instanceof Error && error.message === "Room is full.") {
        return {
          success: false,
          error: {
            code: "ROOM_FULL",
            message: "This room has reached its capacity.",
          },
        };
      }

      throw error;
    }

    if (!addedParticipant) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    const updatedRoom = this.repository.findByCode(roomCode);

    if (!updatedRoom) {
      this.repository.removeParticipant(roomCode, participant.id);

      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve the updated room.",
        },
      };
    }

    return {
      success: true,
      data: {
        room: toRoomSnapshot(updatedRoom),
        participantId: participant.id,
      },
    };
  }

  removeJoinedParticipant(roomCode: string, participantId: string): boolean {
    const room = this.repository.findByCode(roomCode);

    if (!room) return false;

    const participant = room.participants.get(participantId);

    if (!participant || participant.role !== "member") {
      return false;
    }

    return this.repository.removeParticipant(roomCode, participantId);
  }

  sendMessage(
    input: unknown,
    participantId: string | undefined,
  ): AckResult<RoomMessage> {
    const parsed = sendMessageSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Invalid message content or room code.",
        },
      };
    }

    const { roomCode, content } = parsed.data;

    if (!participantId) {
      return {
        success: false,
        error: {
          code: "NOT_AUTHORIZED",
          message: "You must join the room before sending messages.",
        },
      };
    }

    const room = this.repository.findByCode(roomCode);

    if (!room) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    if (room.status === "closed") {
      return {
        success: false,
        error: {
          code: "ROOM_CLOSED",
          message: "This room has been closed.",
        },
      };
    }

    if (!canSendMessage(room.status)) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_ACTIVE",
          message: "Messages are not allowed in this room state.",
        },
      };
    }

    const participant = this.repository.findParticipant(
      roomCode,
      participantId,
    );

    if (!participant) {
      return {
        success: false,
        error: {
          code: "PARTICIPANT_NOT_FOUND",
          message: "Participant not found in this room.",
        },
      };
    }

    if (!participant.isConnected) {
      return {
        success: false,
        error: {
          code: "NOT_AUTHORIZED",
          message: "Disconnected participants cannot send messages.",
        },
      };
    }

    const message: RoomMessage = {
      id: randomUUID(),
      roomCode: room.code,
      type: "chat",
      content,
      senderId: participant.id,
      senderName: participant.displayName,
      createdAt: new Date().toISOString(),
    };

    const savedMessage = this.repository.addMessage(room.code, message);

    if (!savedMessage) {
      return {
        success: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found.",
        },
      };
    }

    return {
      success: true,
      data: savedMessage,
    };
  }
}
