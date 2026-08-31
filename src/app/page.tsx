import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-waiting mb-2">
          Open play, sorted
        </p>
        <h1 className="font-display text-6xl leading-none mb-8">QueueUp PH</h1>
        <div className="space-y-3">
          <Link
            href="/organizer"
            className="tap-target flex items-center justify-center w-full bg-ink text-surface font-display text-2xl rounded-card"
          >
            Organizer panel
          </Link>
          <Link
            href="/queue"
            className="tap-target flex items-center justify-center w-full border-2 border-ink rounded-card font-display text-2xl"
          >
            Queue screen
          </Link>
        </div>
      </div>
    </div>
  );
}
