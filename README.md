<h1 align="center">⚡ Sopranino</h1>

<p align="center">
  <em>Hear 0.1 seconds of a song. Name the track. How fast can you guess?</em>
</p>

<p align="center">
  A full-stack, real-time music guessing game.<br/>
  Solo play, daily streaks, endless speed-run, and live multiplayer rooms.<br/>
  Play it at <a href="https://sopranino.app">sopranino.app</a> - no account needed.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white" alt="NestJS 10" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white" alt="Redis 7" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/Deezer%20API-A238FF?logo=deezer&logoColor=white" alt="Deezer API" />
  <img src="https://img.shields.io/badge/Spotify%20API-1DB954?logo=spotify&logoColor=white" alt="Spotify Web API" />
</p>

---

<p align="center">
  <sub>📹 <em>A professional walkthrough is on the way.</em> In the meantime, see the <a href="#ui-tour">UI tour</a> near the bottom.</sub>
</p>

---

## Table of contents

- [What is Sopranino?](#what-is-sopranino)
- [Game modes](#game-modes)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Technical highlights](#technical-highlights)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Testing & CI](#testing--ci)
- [Deployment](#deployment)
- [UI tour](#ui-tour)
- [Roadmap / What I'd add next](#roadmap--what-id-add-next)

---

## What is Sopranino?

Sopranino is a music guessing game. The core loop: you hear a snippet that starts at **0.1 seconds** and grows with every wrong guess or skip - up to 8 seconds across 6 rounds. Nail the track early for more points.

The music comes from **Deezer**: a curated pool of ~6,000 tracks, every preview, the genre labels, and weekly country charts. **Spotify** is what links your own library - your playlists, your Liked Songs, and the search behind the guess box. You do not need either account to play.

It started as a random idea me and a friend had while playing Songless and Bandle and ended up as an application with four distinct game modes, a real-time multiplayer layer, a daily streak system and much more...

### What makes it interesting, technically

- **End-to-end type safety** - NestJS emits an OpenAPI spec on build, and the frontend consumes an auto-generated TypeScript SDK. DTOs change once, types propagate everywhere.
- **Real-time multiplayer** - Socket.io gateway with session-validated connections, presence tracking, debounced disconnects, and per-round state synced through TanStack Query cache invalidation.
- **Security-first auth** - Spotify OAuth with PKCE (no client secret leaves the backend). Refresh tokens are stored **AES-256-GCM encrypted** in Postgres; access tokens live in Redis. Sessions are opaque IDs in httpOnly cookies.
- **Operational polish** - BullMQ background jobs, session-scoped rate limiting, ownership checks on every game endpoint, structured logging with request context, and a transactional decorator backed by `AsyncLocalStorage`.
- **Thoughtful UX** - Web Audio API amplitude tracking drives a reactive play button (no React re-renders), Framer Motion for every transition with `reducedMotion` honored, image-derived ambient glows, and progressive album-art preloading so wins feel instant.

---

## Game modes

### 🎵 Playlist mode

Pick any playlist from your Spotify library (or your Liked Songs). No Spotify? Play a **curated set** instead - by decade, by genre, or one of the weekly country charts - all drawn from the Deezer pool. The game picks a random track and plays progressively longer snippets across 6 rounds.

| Round    | 1    | 2    | 3   | 4   | 5   | 6   |
| -------- | ---- | ---- | --- | --- | --- | --- |
| Duration | 0.1s | 0.5s | 1s  | 2s  | 4s  | 8s  |

Wrong guesses are evaluated for **partial matches** - if you guessed the right artist, the right album, or both, the game tells you so. Round durations are driven by the backend so the client can't cheat.

### ☀️ The Daily Mystery

One song per day, pulled from a set of playlists you configure (defaults to your Liked Songs). Win to extend your streak. Miss a day, streak resets - **unless you have a streak freeze**, earned by answering music-trivia quizzes. Streak math runs in **the user's own IANA timezone**, not the server's, so midnight actually means midnight where you are.

### 🔥 The Speed Run (Gauntlet mode)

Endless, one-snippet-per-track. Pick a difficulty (**5s Easy → 1s Expert**), then see how long you can survive. One wrong guess or skip ends the run. Personal-best and global leaderboard included.

### 🟣 With Friends (real-time multiplayer)

Create a room, share the invite code, and race your friends live. The host picks the round count and playlist; a shared track pool is built once and streamed to all clients. Every player's per-round status updates for everyone else in real time, and the final leaderboard lands the instant the last player finishes.

---

## Tech stack

### Frontend

| Area          | Choice                                            | Why                                                                                        |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Framework     | **Next.js 16** (App Router) + **React 19**        | Server components + RSC streaming, file-based routing, first-class TypeScript              |
| Language      | **TypeScript 5**                                  | Shared types end-to-end via generated SDK                                                  |
| Server state  | **TanStack Query 5**                              | Caching, optimistic updates, centralized query-key factory                                 |
| Real-time     | **Socket.io client 4**                            | Room-based events, automatic reconnection, cookie-authed handshake                         |
| Styling       | **Tailwind CSS 3** + **shadcn/ui** + **Radix UI** | Design tokens via CSS vars, accessible primitives                                          |
| Animations    | **Framer Motion 12**                              | Spring physics, `AnimatePresence`, user-preference-aware reduced motion                    |
| Audio         | **Web Audio API** + `<audio>`                     | AnalyserNode-driven amplitude visualization, iOS warmup, lock-screen MediaSession controls |
| Forms/search  | **CMDK** command palette, debounced track search  | Forgiving fuzzy search against Spotify's catalog                                           |
| Color theming | **fast-average-color**                            | Dominant-color extraction from album art for ambient UI glows                              |
| Observability | **Vercel Analytics**                              | Core Web Vitals & traffic                                                                  |
| Testing       | **Jest 29** + ts-jest                             | Unit tests for hooks and utilities                                                         |

### Backend

| Area                  | Choice                                      | Why                                                           |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Framework             | **NestJS 10** on Express                    | Module system, DI, decorators, Swagger integration            |
| Language              | **TypeScript 5** with strict mode           |                                                               |
| ORM                   | **Prisma 7**                                | Type-safe queries, migrations, studio for local inspection    |
| Database              | **PostgreSQL 16**                           | Relational model for users, games, rooms, stats               |
| Cache / session store | **Redis 7** (ioredis)                       | Sessions, PKCE state, rate-limit buckets, access-token cache  |
| Queues                | **BullMQ 5**                                | Cron & delayed jobs: abandoned-game sweep, daily track, weekly chart refresh |
| Real-time             | **`@nestjs/websockets` + Socket.io 4**      | Gateway pattern, room broadcasts, session-validated handshake |
| Validation            | **class-validator** + **class-transformer** | DTO validation via pipes                                      |
| Rate limiting         | **`@nestjs/throttler`** + Redis storage     | Session-scoped, not just IP-based                             |
| API docs              | **`@nestjs/swagger` + OpenAPI Generator**   | Single source of truth for frontend SDK                       |
| Music data            | **Deezer API**                              | Track pool, previews, genre labels, weekly country charts     |
| Email                 | **Resend**                                  | Verification and password-reset mail, DKIM/SPF/DMARC signed   |
| Media                 | **Cloudinary**                              | Avatar uploads                                                |
| Auth                  | **Spotify OAuth (PKCE)**                    | No client secret, refresh token encrypted at rest             |
| Testing               | **Jest 29** + `@nestjs/testing`             | Service & controller unit tests                               |
| Logging               | Custom `AppLoggerService`                   | Child loggers, contextual tagging                             |

### Infra & tooling

- **Docker Compose** for local Postgres + Redis
- **pnpm workspaces** (monorepo)
- **GitHub Actions** - lint, typecheck, test, prettier, Prisma generate on every PR
- **ESLint 9** (flat config) with `no-floating-promises` enforced, **Prettier 3** with CI format-check
- Vercel (frontend) + Railway (backend) for deploys

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                            Frontend                           │
│      Next.js 16 · React 19 · TanStack Query · Framer Motion   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐ │
│  │ Playlist │ │   Game   │ │  Daily   │ │  Speed  │ │  MP   │ │
│  │ Browser  │ │  Engine  │ │ Mystery  │ │   Run   │ │ Lobby │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ └───────┘ │
│       ▲             ▲            ▲            ▲         ▲     │
└───────┼─────────────┼────────────┼────────────┼─────────┼─────┘
        │    REST / OpenAPI SDK    │            │  Socket.io    │
        ▼             ▼            ▼            ▼         ▼     │
┌───────────────────────────────────────────────────────────────┐
│                            Backend                            │
│         NestJS 10 · Prisma · BullMQ · Socket.io Gateway       │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐ │
│  │ Auth │ │ Game │ │Playlist│ │ Streak │ │   Multiplayer    │ │
│  │ PKCE │ │ Stats│ │ Liked  │ │ + Quiz │ │ Rooms · Gauntlet │ │
│  └──┬───┘ └──┬───┘ └───┬────┘ └───┬────┘ └────────┬─────────┘ │
│     │        │         │          │               │           │
│     ▼        ▼         ▼          ▼               ▼           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL 16  (users · games · rooms · stats · tracks) │ │
│  │  Redis 7  (sessions · PKCE · throttle · access tokens)   │ │
│  │  BullMQ queues  (abandoned-game cleanup · cron)          │ │
│  │  Cloudinary  (avatars)  ·  Spotify Web API  (tracks)     │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

The **frontend never talks to Spotify directly** - all Spotify calls go through the backend so access tokens and refresh tokens stay server-side. The frontend consumes a TypeScript SDK auto-generated from the backend's OpenAPI spec, so every DTO, every enum, every query parameter is typed.

---

## Technical highlights

### Type-safe API contract (zero drift between client and server)

The backend's `scripts/generate-openapi.ts` boots a NestJS app, extracts the Swagger spec, and writes `swagger-spec.json`. `openapi-generator-cli` then emits a `typescript-fetch` SDK into `frontend/sdk/`. A single `pnpm build:sdk` regenerates both.

Result: every frontend call is typed against the actual backend controller - if I rename a DTO field, `tsc --noEmit` fails in CI on the frontend until I re-run codegen.

### Spotify OAuth with PKCE + encrypted refresh tokens at rest

- `AuthService.startLogin()` generates a UUID state + code verifier + SHA-256 code challenge, stores the PKCE state in Redis with a 10-minute TTL.
- `handleCallback()` atomically reads-and-deletes the PKCE entry (single-use), exchanges the code, and encrypts the returned **refresh token with AES-256-GCM** (32-byte hex key from env) before writing it to Postgres.
- Access tokens never touch the database - they live only in Redis, keyed by session, with an expiry that matches Spotify's response.
- Session IDs are UUIDs set as `httpOnly`, `sameSite=lax`, secure-in-prod cookies. `SessionGuard` validates presence and existence on every protected route.

### Session-scoped rate limiting

Out-of-the-box `@nestjs/throttler` limits by IP, which is wrong for a shared-WiFi world. `SessionThrottlerGuard` keys off the session cookie (falling back to IP if there isn't one) and stores counters in Redis. The login/gate endpoints use stricter buckets to deter brute force.

### Ownership checks on every game endpoint

Earlier, any authenticated user could hit `/game/{id}/guess` with another user's game ID and the backend would happily accept it. PR #50 (`ownership checks to game state and guess endpoints`) closed that - every `GameService` method now joins on `userId` and throws `ForbiddenException` when there's a mismatch.

### Timezone-aware daily streaks

`StreakService` never uses `new Date()`-style "server time." It accepts the user's IANA timezone (from `UserPreference.timezone`, auto-detected client-side and confirmed on the preferences page) and computes "today" via `date-fns-tz`. Streak freezes are first-class: if a gap day is found, consumed freezes are recorded in a `StreakFreezeUsage` audit table so the UI can explain exactly which day was saved.

### Multiplayer gateway with debounced host-disconnect

`RoomsGateway` parses the `unpaused_session` cookie on `handleConnection`, validates it against Redis, and **rejects the socket if the session is invalid** - no anonymous sockets. Presence is tracked in-memory per room (`Map<roomId, Set<userId>>`).

When the host disconnects, the gateway doesn't immediately tear down the room - it waits ~3–5s (debounced) to distinguish a tab refresh from an actual leave. This one detail eliminates 90% of the "my host flickered and the room died" bugs.

Round state is stored in Postgres via `MultiplayerGameService`; WebSocket events simply invalidate TanStack Query caches on the clients, which refetch the authoritative state. The server is the single source of truth; the clients are just projections.

### Background jobs

A BullMQ queue (`GAME_CLEANUP_QUEUE`) runs a cron every 6 hours to mark game sessions that have been idle past a threshold as `ABANDONED`, so they stop hanging around in active-game queries and don't count against stats. Exponential-backoff retry is wired in via a shared `JOB_OPTIONS_WITH_BACKOFF`.

### `@Transactional` decorator with `AsyncLocalStorage`

Instead of threading a Prisma client through every service method, a custom `@Transactional()` decorator uses Node's `AsyncLocalStorage` to transparently propagate the active transaction. Every repository call resolves the Prisma client via a proxy - inside a transactional context it returns the `tx`, outside it returns the root client. Service code stays clean; ACID boundaries are explicit at the decorator.

### Reactive audio amplitude without React re-renders

The play button pulses in sync with the music. Done naïvely that's a `setState` every animation frame - ~60 React renders per second of playback. Instead, `useAudioAmplitude` wires an `AnalyserNode` into a **Framer Motion `MotionValue<number>`**; the button subscribes to the motion value and updates CSS directly via the Motion runtime. React never re-renders, but the UI is perfectly reactive.

### iOS/mobile audio handling

Safari blocks `audio.play()` outside a user gesture and tears down the audio context when the tab backgrounds. `useGameAudio` keeps a warmup audio element, re-primes the context on `visibilitychange`, uses monotonic "play request" IDs to discard stale callbacks, and exposes a `MediaSession` handler so lock-screen play/pause doesn't trigger snippet playback mid-round.

### Optimistic updates (without the "flashes wrong then correct" bug)

Submitting a guess optimistically adds it to the `guesses` list so the UI feels instant. Early on, a race condition would briefly render the guess as "Wrong" before the server's actual `Correct/Artist/Album` result arrived (PR #62). The fix: the optimistic guess carries a `pending` flag that suppresses the color-coded result row until the real mutation settles. Small, but a huge feel improvement.

### Preview-URL resilience

Spotify removed anonymous preview URLs from the public API in early 2026 (PR #79). `PreviewLookupService` resolves them from open, unauthenticated catalogues instead, in order: Deezer by ISRC when one is known (an exact match), then the iTunes Search API, then Deezer search. Matching compares artist and title with Spotify's trailing qualifiers stripped, so `- Mono` and `(Remastered)` don't cause a miss. Results are cached in Redis for 7 days (1 day for a miss) and stored on the `Track` row.

On a 45-track sample spanning the 1960s to the 2020s, iTunes and Deezer each resolved 45/45. The old web-player scraper (`PreviewScraperService`) remains as a last resort and logs whenever it is reached, so it can be retired on evidence.

---

## Getting started

### Prerequisites

- **Node.js 20+**
- **pnpm** (`npm install -g pnpm`)
- **Docker + Docker Compose**
- A **Spotify Developer app** (free)

### 1. Clone & install

```bash
git clone https://github.com/carlosverissimo3001/sopranino.git
cd sopranino
pnpm install
```

### 2. Start Postgres + Redis

```bash
docker compose up -d
```

This brings up Postgres 16 on `:5432` and Redis 7 on `:6379`, both with healthchecks and persistent volumes.

### 3. Create a Spotify app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add redirect URI: `http://localhost:3001/auth/callback`
4. Copy the **Client ID** - PKCE flow, so no client secret needed

### 4. Configure env vars

Start from the template, then fill in your Spotify client ID and generate the encryption key:

```bash
cp backend/.env.example backend/.env
```

**`backend/.env`**

```env
DATABASE_URL="postgresql://unpaused:unpaused_dev@localhost:5432/unpaused?schema=public"
REDIS_URL="redis://localhost:6379"
SPOTIFY_CLIENT_ID="your_client_id"
SPOTIFY_REDIRECT_URI="http://localhost:3001/auth/callback"
SESSION_MAX_AGE_SECONDS="604800"
TOKEN_ENCRYPTION_KEY="64-character-hex-string"   # openssl rand -hex 32
FRONTEND_URL="http://localhost:3000"
# Optional
LAST_FM_API_KEY="..."
CLOUDINARY_URL="cloudinary://..."
RESEND_API_KEY="re_..."                          # unset, and mail goes to the log
EMAIL_FROM="sopranino <hello@mail.example.com>"
EMAIL_REPLY_TO="..."                             # an inbox someone actually reads
PORTFOLIO_URL="..."                              # extra CORS origin for the demo
# Production only: lets one cookie cover the site and the API subdomain.
# Leave unset locally, where localhost and 127.0.0.1 share no parent domain.
COOKIE_DOMAIN=""
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
# Optional site-wide password gate
SITE_PASSWORD="..."
```

### 5. Initialize the database

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Run both servers

```bash
pnpm dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:3001
- Swagger UI → http://localhost:3001/api
- Prisma Studio → `pnpm db:studio`

---

## Project structure

```
sopranino/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Users, GameSessions, Tracks, Stats, MultiplayerRooms, GauntletRuns, UserPreferences…
│   ├── scripts/
│   │   └── generate-openapi.ts   # Emits swagger-spec.json for SDK generation
│   └── src/
│       ├── admin/                # Admin dashboard: user roles, streak question CRUD
│       ├── auth/                 # Spotify OAuth (PKCE), session service, token encryption
│       ├── game/                 # Core single-player engine, guess evaluation, stats
│       ├── gauntlet/             # Speed-run / endless mode, difficulty tiers, leaderboard
│       ├── multiplayer/          # Rooms gateway (WebSocket), room service, track pool
│       ├── playlist/             # Spotify playlist + Liked Songs integration
│       ├── spotify/              # Spotify Web API wrapper with rate-limit handling
│       ├── streak/               # Daily streak + freeze logic, trivia quiz service
│       ├── track/                # Track catalog, preview URL lookup (iTunes/Deezer), Last.fm enrichment
│       ├── transaction/          # @Transactional decorator + AsyncLocalStorage
│       ├── throttle/             # SessionThrottlerGuard (Redis-backed)
│       ├── user-avatar/          # Cloudinary uploads
│       ├── user-preferences/     # Timezone, hints, theme, daily playlist selection
│       ├── redis/                # ioredis module
│       ├── prisma/               # Prisma module with tx-aware proxy
│       ├── logger/               # AppLoggerService
│       └── utils/                # Guards (Session / Admin / Trusted), decorators (@SessionId), normalization helpers
├── frontend/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Home (game modes + playlist grid)
│   │   ├── game/[playlistId]/    # Single-player game
│   │   ├── daily/                # Daily Mystery + daily stats
│   │   ├── speed-run/            # Gauntlet mode + leaderboard
│   │   ├── multiplayer/          # Lobby, room, play, results
│   │   ├── history/              # All-time game history vault
│   │   ├── preferences/          # User settings
│   │   ├── admin/                # Admin dashboard
│   │   ├── gate/                 # Optional site-wide password gate
│   │   └── api/auth/gate/        # Rate-limited gate route handler
│   ├── components/
│   │   ├── game/                 # Game loop UI, volume, reveal card, guess list
│   │   ├── multiplayer/          # Lobby, player rows, invite card, round dots
│   │   ├── daily/                # Streak badge, countdown, score distribution, share pattern
│   │   ├── speed-run/            # Rapid-fire play screen, leaderboard
│   │   ├── streak/               # Freeze prompt, trivia quiz
│   │   ├── history/              # Filterable, paginated history views
│   │   ├── playlist/             # Grid, filters, cards
│   │   ├── features/             # Game mode gallery, app header/footer
│   │   ├── providers/            # Query, Theme, Motion providers
│   │   └── ui/                   # shadcn/ui primitives + custom (ErrorBanner, OfflineBanner, Spinner)
│   ├── hooks/                    # Domain-scoped React hooks (game, multiplayer, spotify, streak, speed-run, admin, auth)
│   ├── sdk/                      # 🔒 auto-generated from swagger-spec.json - do not edit
│   └── lib/                      # queryKeys factory, styles, utils
├── docker-compose.yml            # Local Postgres + Redis
├── swagger-spec.json             # Generated OpenAPI spec
└── pnpm-workspace.yaml
```

---

## Development workflow

| Command                                    | What it does                                  |
| ------------------------------------------ | --------------------------------------------- |
| `pnpm dev`                                 | Runs frontend + backend concurrently          |
| `pnpm dev:frontend` / `pnpm dev:backend`   | Run just one side                             |
| `pnpm build`                               | Production build of both workspaces           |
| `pnpm build:sdk`                           | Regenerate `swagger-spec.json` + frontend SDK |
| `pnpm db:generate`                         | Regenerate Prisma client after schema changes |
| `pnpm db:migrate`                          | Apply / create migrations                     |
| `pnpm db:studio`                           | Open Prisma Studio against local Postgres     |
| `pnpm test`                                | Run all Jest tests (both workspaces)          |
| `pnpm test:backend` / `pnpm test:frontend` | Run one side                                  |

**Anytime you touch a backend DTO or controller signature, run `pnpm build:sdk`.** CI runs the same step on PRs, so drift is caught automatically.

---

## Testing & CI

- **Jest** with `ts-jest` on both workspaces; backend has a spec file colocated with most services (guess evaluator, throttler storage, streak math, etc.).
- **GitHub Actions** (`.github/workflows/ci.yml`) runs on every push to `main` and every PR to `main`/`develop`:
  - **Backend job**: Prisma generate → Prettier format check → ESLint → `tsc --noEmit` → Jest (with a test `DATABASE_URL`)
  - **Frontend job**: ESLint → `tsc --noEmit` → Jest
  - Concurrency group cancels stale runs when new commits land.
- **ESLint 9 flat config** with `@typescript-eslint/no-floating-promises: error` and `curly: [error, all]` - both catches small async bugs that would otherwise slip through.
- **Prettier 3** is CI-enforced; `.prettierignore` skips the generated SDK.

---

## Deployment

- **Frontend** → Vercel at `sopranino.app`. HTTP calls go to `/api/*` and are rewritten to the backend, so they stay same-origin. The websocket cannot use that path - it serves `/socket.io` - so it dials `api.sopranino.app`, and `COOKIE_DOMAIN` scopes the session cookie to cover both.
- **Backend** → Railway (Dockerized NestJS), served at `api.sopranino.app`. Postgres and Redis are provisioned add-ons; `TOKEN_ENCRYPTION_KEY` is an environment secret generated via `openssl rand -hex 32`.
- **Production migrations** run via `pnpm --filter backend prisma:migrate-prod` (see `scripts/` in `backend/`), kicked off on deploy.

---

## UI tour

> A full walkthrough video will replace this section soon. Until then, here's a static tour.

<!-- Portrait screenshots laid out 2 per row -->
<table width="100%">
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/home.png" alt="Home page - pick a game mode or a Spotify playlist" width="100%" />
      <br/>
      <b>Home</b>
      <br/>
      <sub>Pick a game mode (Daily, Speed Run, Multiplayer) or one of your Spotify playlists</sub>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/gameplay.png" alt="Mid-round gameplay with partial-match hints" width="100%" />
      <br/>
      <b>Single-player gameplay</b>
      <br/>
      <sub>Progressive snippets, search-as-you-type, and partial-match hints (artist / album)</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/reveal.png" alt="Song reveal card after a win" width="100%" />
      <br/>
      <b>Song reveal</b>
      <br/>
      <sub>Album art preloads so the win animation is seamless, with deep links to Spotify</sub>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/speedrun.png" alt="Speed Run setup - difficulty tiers and playlist picker" width="100%" />
      <br/>
      <b>Speed Run setup</b>
      <br/>
      <sub>Four difficulty tiers (5s Easy → 1s Expert) with any playlist as the source pool</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/speedrun-gameplay.png" alt="Speed Run gameplay with score and recent tracks" width="100%" />
      <br/>
      <b>Speed Run gameplay</b>
      <br/>
      <sub>Endless rapid-fire rounds, new personal best celebrated inline, recently-nailed tracks kept close</sub>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="assets/screenshots/stats.png" alt="Daily challenge history - streaks, win rate, perfect scores" width="100%" />
      <br/>
      <b>The Vault · daily stats</b>
      <br/>
      <sub>Daily challenge history with streaks, win rate, and perfect-score counter</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" colspan="2">
      <img src="assets/screenshots/history.png" alt="All-time history filtered by artist and by victories" width="60%" />
      <br/>
      <b>History + filters</b>
      <br/>
      <sub>Paginated, filterable history across every game mode, searchable by track or artist</sub>
    </td>
  </tr>
</table>

<!-- Landscape (multiplayer) screenshots each get their own row so both windows stay readable -->
<table width="100%">
  <tr>
    <td align="center" valign="top">
      <img src="assets/screenshots/multiplayer.png" alt="Final results shown on two players' screens side by side" width="100%" />
      <br/>
      <b>Multiplayer results</b> <sub>- two clients, one source of truth</sub>
      <br/>
      <sub>Synced leaderboard and per-round breakdown across every player's screen</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="assets/screenshots/waiting.png" alt="Multiplayer waiting room with per-player progress bars" width="100%" />
      <br/>
      <b>Realtime presence</b> <sub>- WebSocket-driven</sub>
      <br/>
      <sub>Per-player progress bars while waiting for the round to end; finishers see the lobby, stragglers stay in the round</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="assets/screenshots/view-results.png" alt="Multiplayer round-end showing reveal on one player and results on another" width="100%" />
      <br/>
      <b>Round transitions</b> <sub>- stay in sync</sub>
      <br/>
      <sub>Hosts and players stay in sync across navigation, reveal, and results even when they finish at different times</sub>
    </td>
  </tr>
</table>

---

## Roadmap / What I'd add next

Some things that are scoped but not built (or only partially built):

- **E2E tests** with Playwright that cover the full auth → gameplay → history loop
- **Redis-based pub/sub for multiplayer** so the backend scales horizontally beyond a single Socket.io node
- **Spotify Premium full-track playback** for Premium users so the 30-second preview limit goes away
- **Observability stack** - OpenTelemetry exporters and a proper dashboard (current structured logging is a stepping stone)
- **A11y pass** - keyboard flow is reasonable but I want screen-reader coverage verified top-to-bottom
- **Internationalization** - strings are already centralized, just not wired to a locale loader yet

---

## License

This repository is published for portfolio purposes. The code is shared "as is" without warranty; please don't deploy a copy as a commercial service.

Music data is provided by Deezer. Spotify, the Spotify logo, and related marks are trademarks of Spotify AB; Deezer and its marks are trademarks of Deezer S.A. This project is affiliated with neither.

---
