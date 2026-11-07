import { useContext } from "react";
import { RoomSessionContext } from "../app/RoomSessionProvider";

export function useRoomSession() {
  const context = useContext(RoomSessionContext);

  if (!context) {
    throw new Error("useRoomSession must be used inside RoomSessionProvider");
  }

  return context;
}
