# QueueUp PH

A courtside queue, auto-matching, and leaderboard app for a single Philippine
pickleball open-play session. One organizer runs the session from their
phone; players just glance at a shared screen.

Three pages, on purpose:

- **`/organizer`** — PIN-protected control panel. Set up the session, check
  players in, report winners.
- **`/queue`** — public, read-only, TV-friendly display of live courts and
  the waiting line. No PIN.
- **`/leaderboard`** — public, read-only standings for the current session.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project, and
   wait for it to finish provisioning.
2. Open **SQL Editor** in the Supabase dashboard, paste in the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   the `sessions`, `players`, `courts`, and `matches` tables, sets up
   indexes, enables row-level security with policies for the anon key, and
   turns on Realtime replication for all four tables.
3. Go to **Project Settings > API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
ORGANIZER_PIN=2468
```

`ORGANIZER_PIN` is a shared PIN, not real auth — anyone who knows it can
manage the session. It's checked server-side by `/api/verify-pin` and, once
correct, unlocked for that browser tab via `sessionStorage`.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start a session from
`/organizer`, then open `/queue` in a second tab (or cast it to a TV) to see
it update live.

## 4. Deploy to Vercel

```bash
npm install -g vercel   # if you don't already have it
vercel
```

When prompted, link or create a project, then add the same three
environment variables in the Vercel dashboard (**Project > Settings >
Environment Variables**) or via the CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ORGANIZER_PIN
```

Then ship it:

```bash
vercel deploy --prod
```

Print the `/queue` URL as a QR code (the page already renders one pointing
at itself) or share the link directly so players can follow along on their
own phones.

## How matching works

`src/lib/matching.ts` holds the whole algorithm as a small set of pure
functions (see `formNextMatch`):

1. Pull the 4 longest-waiting players.
2. If those 4 span all three skill tiers, look at most 2 positions further
   into the line for a swap that tightens the range — fairness (wait time)
   always wins over a perfect skill match.
3. Split into teams by pairing the strongest and weakest player against the
   middle two, so games are competitive rather than stacked.
4. Fewer than 4 people waiting → that court shows "Waiting for more
   players" instead of forcing a mismatched game.

The organizer's browser is the single source of truth that runs this
algorithm and writes the result to Supabase whenever a court opens up;
`/queue` and `/leaderboard` are pure realtime readers.

## Notes

- No player accounts, no payments, no multi-session history — this is a
  single-session, walk-up tool by design. A new session simply starts fresh
  (mark the old one inactive in the `sessions` table, or just insert a new
  row — `/organizer` always picks up the most recent active session).
- Fee collection happens in person; the app has no billing logic.
