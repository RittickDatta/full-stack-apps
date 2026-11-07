import { useState, type FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useRoomSession } from "../../hooks/useRoomSession";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;

function validateDisplayName(value: string): string | null {
  const name = value.trim();

  if (!name) {
    return "Please enter your display name.";
  }

  if (name.length < MIN_NAME_LENGTH) {
    return "Your name must contain at least 2 characters.";
  }

  if (name.length > MAX_NAME_LENGTH) {
    return "Your name must contain at most 30 characters.";
  }

  return null;
}

export function CreateRoomForm() {
  const navigate = useNavigate();

  const { session, createRoom, isBusy, error, clearError } = useRoomSession();

  const [displayName, setDisplayName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const name = displayName.trim();
    const nextError = validateDisplayName(name);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    setValidationError(null);

    const roomCode = await createRoom(name);

    if (roomCode) {
      navigate(`/room/${encodeURIComponent(roomCode)}`);
    }
    
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label
          htmlFor="creator-display-name"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Your display name
        </label>

        <input
          id="creator-display-name"
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={MAX_NAME_LENGTH}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setValidationError(null);
            clearError();
          }}
          placeholder="e.g. Alice"
          aria-invalid={Boolean(validationError)}
          aria-describedby={
            validationError ? "creator-name-error" : "creator-name-help"
          }
          disabled={isBusy || Boolean(session)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
        />

        {validationError ? (
          <p
            id="creator-name-error"
            role="alert"
            className="mt-2 text-sm text-red-600"
          >
            {validationError}
          </p>
        ) : (
          <p id="creator-name-help" className="mt-2 text-sm text-slate-500">
            This name will be visible to other participants.
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

      <Button type="submit" fullWidth disabled={isBusy || Boolean(session)}>
        {isBusy ? "Creating room..." : "Create room"}
      </Button>

      {session && (
        <p className="text-sm text-slate-600">
          You already have a room session.
        </p>
      )}
    </form>
  );
}
