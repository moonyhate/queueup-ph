"use client";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-2xl">
        <h2 className="font-display text-2xl leading-none mb-2">{title}</h2>
        <p className="text-sm text-waiting mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="tap-target flex-1 bg-red-700 text-white rounded-card font-mono text-xs uppercase"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="tap-target flex-1 border-2 border-ink/20 rounded-card font-mono text-xs uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}