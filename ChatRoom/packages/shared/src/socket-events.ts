
export interface ConnectionInfo {
  socketId: string;
  connectedAt: string;
}

export interface PingAcknowledgement {
  success: true;
  message: string;
  receivedAt: string;
}

export interface ServerToClientEvents {
  "connection:ready": (info: ConnectionInfo) => void;
}

export interface ClientToServerEvents {
  "connection:ping": (
    payload: { message: string },
    acknowledge: (response: PingAcknowledgement) => void,
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {}
