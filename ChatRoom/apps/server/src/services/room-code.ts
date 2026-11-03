
import { randomInt } from "node:crypto";

import {
  ROOM_CODE_CHARACTERS,
  ROOM_CODE_LENGTH,
} from "@chatroom/shared";

export function generateRoomCode(): string {
  let code = "";

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const index = randomInt(ROOM_CODE_CHARACTERS.length);

    code += ROOM_CODE_CHARACTERS[index];
  }

  return code;
}
