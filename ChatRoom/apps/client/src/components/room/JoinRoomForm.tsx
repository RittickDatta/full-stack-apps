
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ROOM_CODE_LENGTH } from "@chatroom/shared";

import { Button } from "../ui/Button";
import { useRoomSession } from "../../hooks/useRoomSession";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;

export function JoinRoomForm() {
  const navigate = useNavigate();

  const {
    session,
    joinRoom,
    isBusy,
    error,
    clearError,
  } = useRoomSession();

  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    roomCode?: string;
    displayName?: string;
  }>({});

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isBusy || session) return;

    const code = roomCode.trim().toUpperCase();
    const name = displayName.trim();

    const errors: {
      roomCode?: string;
      displayName?: string;
    } = {};

    if (
      code.length !== ROOM_CODE_LENGTH ||
      !/^[A-Z0-9]+$/.test(code)
    ) {
      errors.roomCode =
        `Enter a valid ${ROOM_CODE_LENGTH}-character room code.`;
    }

    if (
      name.length < MIN_NAME_LENGTH ||
      name.length > MAX_NAME_LENGTH
    ) {
      errors.displayName =
        `Your name must be ${MIN_NAME_LENGTH}–${MAX_NAME_LENGTH} characters.`;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const joinedCode = await joinRoom(code, name);

    if (joinedCode) {
      navigate(
        `/room/${encodeURIComponent(joinedCode)}`,
      );
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="join-room-code"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Room code
        </label>

        <input
          id="join-room-code"
          name="roomCode"
          type="text"
          value={roomCode}
          maxLength={ROOM_CODE_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. A7K9PQ"
          disabled={isBusy || Boolean(session)}
          aria-invalid={Boolean(fieldErrors.roomCode)}
          aria-describedby={
            fieldErrors.roomCode
              ? "join-code-error"
              : "join-code-help"
          }
          onChange={(event) => {
            setRoomCode(event.target.value.toUpperCase());
            setFieldErrors((current) => ({
              ...current,
              roomCode: undefined,
            }));
            clearError();
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-lg font-semibold uppercase tracking-widest text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
        />

        {fieldErrors.roomCode ? (
          <p
            id="join-code-error"
            role="alert"
            className="mt-2 text-sm text-red-600"
          >
            {fieldErrors.roomCode}
          </p>
        ) : (
          <p
            id="join-code-help"
            className="mt-2 text-sm text-slate-500"
          >
            Ask the room creator for their code.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="join-display-name"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Your display name
        </label>

        <input
          id="join-display-name"
          name="displayName"
          type="text"
          value={displayName}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          placeholder="e.g. Bob"
          disabled={isBusy || Boolean(session)}
          aria-invalid={Boolean(fieldErrors.displayName)}
          aria-describedby={
            fieldErrors.displayName
              ? "join-name-error"
              : "join-name-help"
          }
          onChange={(event) => {
            setDisplayName(event.target.value);
            setFieldErrors((current) => ({
              ...current,
              displayName: undefined,
            }));
            clearError();
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
        />

        {fieldErrors.displayName ? (
          <p
            id="join-name-error"
            role="alert"
            className="mt-2 text-sm text-red-600"
          >
            {fieldErrors.displayName}
          </p>
        ) : (
          <p
            id="join-name-help"
            className="mt-2 text-sm text-slate-500"
          >
            Other participants will see this name.
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        disabled={isBusy || Boolean(session)}
      >
        {isBusy ? "Joining room..." : "Join room"}
      </Button>
    </form>
  );
}
