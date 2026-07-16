# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Commands

Package manager is bun (`bun.lock`).

- `bun install` — install dependencies
- `bun run dev` — start the Next.js (Turbopack) dev server at http://localhost:3000
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test suite in this repo.

MongoDB must be running and reachable at `MONGODB_URI` (see `.env.example`) for `/api/*` routes to work; the rest of the app runs fine without it.

## Architecture

Next.js App Router, single route (`app/page.tsx` → `app/layout.tsx`). Tailwind CSS v4 is wired via `@import "tailwindcss"` in `app/globals.css` (no `tailwind.config.*`; theme tokens are declared inline with `@theme inline`). The `@/*` path alias maps to the repo root (`tsconfig.json`).

The app is a single product, **Boardly** (a Trello-style board app):

- `app/page.tsx` renders `TrelloApp` (`app/components/trello/TrelloApp.tsx`), the single stateful component. All app state — current view, boards, roster, active drag, open modals, theme, etc. — lives in one `useState` object there and is passed down as props/callbacks. **This state is still in-memory only and resets on reload** — the MongoDB-backed API below is a proof-of-plumbing read path, not yet the source of truth for boards/cards. Full migration (mutations, optimistic updates) is future work.
- The other components in `app/components/trello/` (`LoginView`, `Sidebar`, `TopNav`, `DashboardView`, `AdminView`, `BoardView`, `CreateBoardModal`, `CardModal`) are presentational: they receive derived data and callbacks and don't own state themselves.
- `app/lib/trello/types.ts` and `app/lib/trello/data.ts` hold the domain types (Board/List/Card/Member/Label), seed/demo data, and theme color derivation (`getThemeColors`).
- Login is a fake picker between two hardcoded demo users (admin "Ari", member "Jess"); role determines board visibility — admins see every board, members only see boards whose `memberIds` include them.
- Card drag-and-drop between lists uses native HTML5 DnD (`draggable` + `onDragStart`/`onDragOver`/`onDrop`); the in-flight card/list id is tracked in a `useRef` (not state) so dragging doesn't trigger re-renders.
- Icons are `lucide-react` components (already a dependency), not text glyphs (`+`, `×`, `✓`, `←`, `⋯`, emoji, etc.) — sized `size={12–16}` to match surrounding text, per convention in `app/components/trello/TopNav.tsx`.

### Backend: MongoDB + Hono + TanStack Query

- `app/lib/mongodb.ts` — `MongoClient` singleton (connection string from `MONGODB_URI`, cached on `global` in dev so Turbopack Fast Refresh doesn't reopen connections).
- `app/server/hono.ts` — the Hono app and all route definitions (`GET /api/health`, `GET /api/boards`), kept framework-agnostic and separate from the Next.js mount point.
- `app/api/[[...route]]/route.ts` — mounts the Hono app into Next.js's Route Handler convention via `hono/vercel`'s `handle()`. All API routes live under this single catch-all.
- `app/providers.tsx` — wraps the app in `QueryClientProvider`; mounted in `app/layout.tsx`. `TrelloApp` uses `useQuery(["boards"], ...)` against `/api/boards` to show a live MongoDB board count in the dashboard header, alongside (not replacing) the in-memory demo boards.
- `GET /api/boards` seeds the `boards` collection from `initialBoards()` on first read if empty — a fundamentals-pass shortcut, not a real seeding strategy.
