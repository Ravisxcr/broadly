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

Next.js App Router. The catch-all route `app/[[...slug]]/page.tsx` → `app/layout.tsx` renders `TrelloShell` for every path, so board/card URLs (e.g. `/board/:id`, `/board/:id/card/:id`) are handled client-side rather than via separate route files. Tailwind CSS v4 is wired via `@import "tailwindcss"` in `app/globals.css` (no `tailwind.config.*`; theme tokens are declared inline with `@theme inline`). The `@/*` path alias maps to the repo root (`tsconfig.json`).

The app is a single product, **Boardly** (a Trello-style board app):

- State is split across React Context providers under `app/lib/trello/contexts/` — `ThemeProvider`, `AuthProvider`, `BoardsProvider`, `WorkspacesProvider`, `NavigationProvider` — composed in `TrelloProviders.tsx` and mounted (alongside `QueryClientProvider`) in `app/providers.tsx`, which wraps `app/layout.tsx`. There is no single top-level `useState` blob anymore; each context owns one concern and exposes it via a `use*` hook (`useAuth`, `useBoards`, `useWorkspaces`, `useNavigation`, `useTheme`).
- `TrelloShell.tsx` (`app/components/trello/TrelloShell.tsx`) is the top-level gate: renders `LoginView` if there's no authenticated user, a loading/retry state while boards/workspaces are fetching, otherwise `MainLayout.tsx`, which composes `Sidebar`, `TopNav`, and the active view (`DashboardView` / `AdminView` / `BoardView`) plus modals, all driven by `NavigationContext`.
- `NavigationContext` keeps `view`/`activeBoardId`/`selectedCardId` in state and mirrors it to the URL (`app/lib/trello/url.ts`, `useUrlSync` hook) so board/card links are deep-linkable and browser back/forward works; `skipUrlSyncRef` prevents the sync effect from fighting its own navigate() calls.
- `app/lib/trello/types.ts` and `app/lib/trello/data.ts` hold the domain types (Board/List/Card/Member/Label), demo/seed data, and theme color derivation (`getThemeColors`).
- Login is OAuth-only: `LoginView` renders a button per enabled provider (GitHub/Google/Microsoft, from `GET /api/auth-providers`) via Better Auth's `authClient.signIn.social`. `AuthContext` derives `currentUserId`/`currentUser` entirely from the real session (`authClient.useSession()`) — there's no local/demo login path. `roster` (seeded from `DEFAULT_ROSTER`) is still separate in-memory membership data used for board visibility and avatars; real OAuth users default to the `member` role and are added to `roster` via `AdminView`'s `addMember`, not automatically.
- Card drag-and-drop between lists uses native HTML5 DnD (`draggable` + `onDragStart`/`onDragOver`/`onDrop`); the in-flight card/list id is tracked in a `useRef` (not state) so dragging doesn't trigger re-renders.
- Icons are `lucide-react` components (already a dependency), not text glyphs (`+`, `×`, `✓`, `←`, `⋯`, emoji, etc.) — sized `size={12–16}` to match surrounding text, per convention in `app/components/trello/TopNav.tsx`.

### Backend: MongoDB + Hono + TanStack Query + Better Auth

- `app/lib/mongodb.ts` — `MongoClient` singleton (connection string from `MONGODB_URI`, cached on `global` in dev so Turbopack Fast Refresh doesn't reopen connections).
- Local/standalone MongoDB (no replica set) does not support retryable writes or multi-document transactions. `MONGODB_URI` needs `retryWrites=false`, and `app/server/auth.ts` passes `transaction: false` to `mongodbAdapter` for the same reason — otherwise Better Auth's user-creation flow (which wraps user+account creation in a transaction whenever a `client` is given) fails with `unable_to_create_user` / "This MongoDB deployment does not support retryable writes". Revisit both if the deployment ever moves to a real replica set (e.g. Atlas).
- `app/server/auth.ts` — the Better Auth instance (`mongodbAdapter`), plus `socialProviders` built conditionally per-provider from env vars (`GITHUB_CLIENT_ID`/`SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `MICROSOFT_CLIENT_ID`/`SECRET`/`TENANT_ID`) — a provider is only registered if both id and secret are set. `enabledSocialProviders` is exported for the frontend to know which OAuth buttons to show.
- `app/server/hono.ts` — the Hono app and all route definitions, kept framework-agnostic and separate from the Next.js mount point. Mounts Better Auth at `/api/auth/**`; exposes `/api/auth-providers`, `/api/health`, `/api/members` (real registered Better Auth users), and full CRUD for `/api/boards`, `/api/workspaces`, and nested lists/cards (`/api/boards/:boardId/lists`, `/api/boards/:boardId/lists/:listId/cards`, `/api/boards/:boardId/cards/:cardId`, `/api/boards/:boardId/move-card`) backed by separate `boards`/`lists`/`cards`/`workspaces` Mongo collections.
- `app/api/[[...route]]/route.ts` — mounts the Hono app into Next.js's Route Handler convention via `hono/vercel`'s `handle()`. All API routes live under this single catch-all.
- Boards and workspaces are now fully MongoDB-backed, not just a read path: `BoardsContext`/`WorkspacesContext` (`app/lib/trello/contexts/`) wrap TanStack Query (`useQuery`/`useMutation`) around the Hono API, with optimistic updates (`onMutate` + cache rollback on error) for board/card edits, drag-and-drop moves, and deletes. There's no more in-memory demo-board fallback merged in on top.
