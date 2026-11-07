
import {
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";

import { HomePage } from "../pages/HomePage";
import { CreateRoomPage } from "../pages/CreateRoomPage";
import { JoinRoomPage } from "../pages/JoinRoomPage";
import { ChatRoomPage } from "../pages/ChatRoomPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="create"
          element={<CreateRoomPage />}
        />

        <Route
          path="join"
          element={<JoinRoomPage />}
        />

        <Route
          path="room/:roomCode"
          element={<ChatRoomPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}
