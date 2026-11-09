import { useEffect, useRef } from "react";

interface RoomActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RoomActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  isBusy,
  onConfirm,
  onCancel,
}: RoomActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();

      // Focus the safe action first for destructive dialogs.
      const cancelButton = dialog.querySelector<HTMLButtonElement>(
        '[data-dialog-cancel="true"]',
      );

      if (destructive) {
        cancelButton?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, destructive]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        if (isBusy) {
          event.preventDefault();
          return;
        }

        onCancel();
      }}
      onClose={() => {
        if (open && !isBusy) {
          onCancel();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50"
      aria-labelledby="room-action-title"
      aria-describedby="room-action-description"
    >
      <h2 id="room-action-title" className="text-xl font-bold">
        {title}
      </h2>

      <p
        id="room-action-description"
        className="mt-3 text-sm leading-6 text-slate-600"
      >
        {description}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          data-dialog-cancel="true"
          onClick={onCancel}
          disabled={isBusy}
        >
          Cancel
        </button>

        <button
          ref={confirmButtonRef}
          type="button"
          onClick={onConfirm}
          disabled={isBusy}
        >
          {isBusy ? "Processing..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
