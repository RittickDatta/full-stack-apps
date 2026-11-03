
export type MessageType = "chat" | "system";

export interface RoomMessage {
  id: string;
  roomCode: string;
  type: MessageType;
  content: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
}

export interface SendMessagePayload {
  roomCode: string;
  content: string;
}
