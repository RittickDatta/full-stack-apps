
export const ROOM_CODE_LENGTH = 6;

export const ROOM_CODE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const MAX_PARTICIPANTS = 20;

export const MAX_DISPLAY_NAME_LENGTH = 30;

export const MAX_MESSAGE_LENGTH = 2000;

export const ROOM_STATES = [
  "created",
  "active",
  "locked",
  "closed",
] as const;

export const PARTICIPANT_ROLES = [
  "creator",
  "member",
] as const;
