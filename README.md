# Boardly

A Trello-style board app for organizing your team's work — built with Next.js (App Router), MongoDB, Hono, TanStack Query, and Better Auth.

## Features

- Boards, lists, and cards with native HTML5 drag-and-drop
- Workspaces for grouping related boards
- OAuth-only sign-in (GitHub / Google / Microsoft — enable whichever you configure)
- Role-based access: an admin grants board/workspace access to newly registered members
- Light/dark theme
- Deep-linkable board and card URLs (`/board/:id`, `/board/:id/card/:id`)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (package manager and script runner)
- A running MongoDB instance (local standalone or Atlas), reachable at `MONGODB_URI`

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values — see the comments inside for local-vs-Atlas Mongo setup and how to generate `BETTER_AUTH_SECRET`. At minimum you need `MONGODB_URI`, `MONGODB_DB`, and `BETTER_AUTH_SECRET`; OAuth provider credentials are optional (a provider's login button only appears once both its client id and secret are set).

3. For local/self-hosted MongoDB, provision a scoped app user (readWrite on one database only — not an admin account) by running `scripts/create-db-user.mjs` once against an admin connection:

   ```bash
   MONGODB_URI="mongodb://root:changeme@127.0.0.1:27017/admin?authSource=admin" \
   APP_DB_NAME=app APP_DB_USER=boardly_app APP_DB_PASSWORD=changeme \
   bun scripts/create-db-user.mjs
   ```

   Then point `.env.local`'s `MONGODB_URI` at that scoped user. On Atlas, create the user instead via the Atlas Database Access UI with a role scoped to one database (e.g. `readWrite@app`).

4. (Optional) Seed demo boards/lists/cards:

   ```bash
   bun scripts/seed.mjs
   ```

5. Start the dev server:

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Commands

- `bun run dev` — start the Next.js (Turbopack) dev server
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — ESLint

There is no test suite in this repo.

## Architecture

Next.js App Router with a catch-all route (`app/[[...slug]]/page.tsx`) that renders the whole app client-side, so board/card URLs are handled without separate route files. State is split across React Context providers (`app/lib/trello/contexts/`) — theme, auth, boards, workspaces, and navigation — each backed by TanStack Query against a Hono API mounted under `/api/*` (`app/server/hono.ts`), which talks to MongoDB and Better Auth.

See [CLAUDE.md](./CLAUDE.md) for a fuller architecture writeup (contexts, backend routes, auth/session model, MongoDB access patterns).
