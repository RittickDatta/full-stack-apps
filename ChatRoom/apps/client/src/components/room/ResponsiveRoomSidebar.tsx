
import { useState } from "react";

import type { RoomSession } from "../../types/room-session";
import { RoomSidebar } from "./RoomSidebar";

interface ResponsiveRoomSidebarProps {
  session: RoomSession;
}

export function ResponsiveRoomSidebar({
  session,
}: ResponsiveRoomSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-room-sidebar"
          onClick={() => setIsOpen((current) => !current)}
          className="touch-target flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
        >
          <span>Participants and room controls</span>

          <span aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </div>

      <div
        id="mobile-room-sidebar"
        className={isOpen ? "block lg:block" : "hidden lg:block"}
      >
        <RoomSidebar session={session} />
      </div>
    </div>
  );
}
