
import type {
  PARTICIPANT_ROLES,
} from "./constants.js";

export type ParticipantRole =
  (typeof PARTICIPANT_ROLES)[number];

export interface Participant {
  id: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
  isConnected: boolean;
}
