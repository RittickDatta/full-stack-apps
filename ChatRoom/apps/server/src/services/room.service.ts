import { randomUUID } from "node:crypto";

import {
  MAX_PARTICIPANTS,
  canStartRoom,
  createRoomSchema,
  startRoomSchema,
} from "@chatroom/shared";

import type {
  AckResult,
  CreateRoomResult,
  Participant,
  StartRoomResult,
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
}
