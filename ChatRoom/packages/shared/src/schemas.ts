
import { z } from "zod";

import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  MIN_MESSAGE_LENGTH,
  ROOM_CODE_CHARACTERS,
  ROOM_CODE_LENGTH,
  ROOM_STATES,
  PARTICIPANT_ROLES,
} from "./constants.js";

import type {
  CloseRoomPayload,
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  LockRoomPayload,
  StartRoomPayload,
} from "./socket-events.js";

import type { SendMessagePayload } from "./message.js";

// A six-character, uppercase room code.
// We normalize lowercase input before validation.
const roomCodePattern = new RegExp(
  `^[${ROOM_CODE_CHARACTERS}]{${ROOM_CODE_LENGTH}}$`,
);

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    roomCodePattern,
    "Room code must contain six valid characters.",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(
    MIN_DISPLAY_NAME_LENGTH,
    `Display name must contain at least ${MIN_DISPLAY_NAME_LENGTH} characters.`,
  )
  .max(
    MAX_DISPLAY_NAME_LENGTH,
    `Display name cannot exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`,
  )
  .refine(
    (value) => !/[\u0000-\u001F\u007F]/.test(value),
    "Display name cannot contain control characters.",
  );

export const messageContentSchema = z
  .string()
  .trim()
  .min(
    MIN_MESSAGE_LENGTH,
    "Message cannot be empty.",
  )
  .max(
    MAX_MESSAGE_LENGTH,
    `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
  )
  .refine(
    (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value),
    "Message contains unsupported control characters.",
  );

export const creatorTokenSchema = z
  .string()
  .min(16, "Creator token is invalid.")
  .max(256, "Creator token is invalid.");

export const roomStatusSchema = z.enum(ROOM_STATES);

export const participantRoleSchema =
  z.enum(PARTICIPANT_ROLES);

export const createRoomSchema = z.object({
  displayName: displayNameSchema,
}).strict() satisfies z.ZodType<CreateRoomPayload>;

export const startRoomSchema = z.object({
  roomCode: roomCodeSchema,
  creatorToken: creatorTokenSchema,
}).strict() satisfies z.ZodType<StartRoomPayload>;

export const joinRoomSchema = z.object({
  roomCode: roomCodeSchema,
  displayName: displayNameSchema,
}).strict() satisfies z.ZodType<JoinRoomPayload>;

export const sendMessageSchema = z.object({
  roomCode: roomCodeSchema,
  content: messageContentSchema,
}).strict() satisfies z.ZodType<SendMessagePayload>;

export const lockRoomSchema = z.object({
  roomCode: roomCodeSchema,
  creatorToken: creatorTokenSchema,
}).strict() satisfies z.ZodType<LockRoomPayload>;

export const leaveRoomSchema = z.object({
  roomCode: roomCodeSchema,
}).strict() satisfies z.ZodType<LeaveRoomPayload>;

export const closeRoomSchema = z.object({
  roomCode: roomCodeSchema,
  creatorToken: creatorTokenSchema,
}).strict() satisfies z.ZodType<CloseRoomPayload>;
