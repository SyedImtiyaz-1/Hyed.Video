# Welcome to Hyped

Hyped (hyped.video) makes videos for people's products. Two kinds:

- **Product videos.** Paste a website or GitHub repo, and an AI agent (OpenAI Codex for Standard, Claude for Studio)
  builds an animated launch, demo or feature video with a narration and music.
- **Reels.** Upload your own talking video, and Hyped cuts the dead air and adds word-by-word captions, emojis,
  punch-ins, sound effects, stock B-roll and music. A full editor (with an "Ask AI" chat) lets you change everything,
  then export again for free.

Customers buy credit packs ($9, $35, $89) through Dodo Payments. Everything runs on Cloudflare.

## Read first (in this order)

1. `README.md`: how it's built, the security model, how deploys work.
2. `docs/ARCHITECTURE.md`: how a website becomes a video, and how payments become credits.
3. `LOCAL_TESTING.md`: running the whole thing on your laptop.
4. `docs/STRATEGY.md`, `docs/PLAN.md`, `docs/UNIT_ECONOMICS.md`: the business, the plan, what a video costs us.

## How the code is laid out

| Folder | What it is |
|---|---|
| `web/` | The website and dashboard: Next.js 15 on Cloudflare Workers (OpenNext), Clerk sign-in, Prisma on Postgres. API routes are in `web/app/api`. The reel and video editor is `web/components/reels`. |
| `render/` | The render Worker: one Cloudflare Workflow per video, a throwaway container per job, R2 storage, a cron safety net, and the Ask AI chat (`ReelAssistant`). It holds the AI keys; containers never do. |
| `runner/` | Code that runs inside the container. `run-job.ts` drives the AI agent for product videos; `reel.ts` is the ffmpeg + libass editing pipeline for reels (and now for editing product videos too). |
| `packages/core/` | Shared by everything: the database schema (`prisma/schema.prisma`), pricing, caption styles, the edit format, the Ask AI changes. |
| `scripts/` | Setup and deploy helpers (`npm run …`). |

## Your accounts

You'll get invites to these with your own login. Never use someone else's.

- **GitHub:** the `SyedImtiyaz-1/Hyped.Video` repo.
- **Clerk:** the Hyped app (development instance), for local sign-in.
- **OpenAI:** an API key from a development project with a monthly spend limit. Local videos cost real money, about
  $0.75 each.
- **Pixabay:** make your own free account and API key, for stock B-roll.
- **Dodo Payments (test mode only)**, and **Anthropic** (for Studio videos): only if your work needs them.

Production (Cloudflare, the production database, live payments) comes later, if at all. Keys are shared through the
password manager, never over chat or email.

## First day: run it locally

You need Docker Desktop, Node 20 or newer, and git.

```bash
git clone https://github.com/SyedImtiyaz-1/Hyped.Video.git hyped && cd hyped
git checkout launch/caption-styles
npm install
cp .env.example .env
```

1. Fill in `.env`. On a Mac, these commands ask for each key in a hidden dialog and save it for you:
   `npm run openai-key`, `npm run pixabay-key` and `npm run dodo` (Dodo test keys, only if you need checkout).
   Elsewhere, edit the files by hand. In `.env`, set `NEXT_PUBLIC_APP_URL=http://localhost:3001` (the local site's
   port). Local sign-in uses Clerk's **development** instance: create `web/.env.local` by hand with its keys
   (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…`, `CLERK_SECRET_KEY=sk_test_…`) plus
   `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` and both
   `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` set to
   `/dashboard`. (`npm run clerk` is only for the production key.)
2. `npm run repo-keys -- --local` makes the local keys for private-repo tokens.
3. Pick any random string for `DEV_START_TOKEN` and put the same one in `.env` and in `render/.dev.vars`. Also add
   `PUBLIC_VIDEO_BASE_URL=http://localhost:8787/media` to `render/.dev.vars`. Then `npm run keys` checks the AI keys
   and copies them into `render/.dev.vars`.
4. Open Docker Desktop. The first time, create the local database's tables: `docker compose up -d`, then
   `npm run db:push`.
5. Run `npm run dev:all`. It starts the database, the render service (port 8787) and the site at
   **http://localhost:3001**. The first start builds the video container, which takes a few minutes.
6. Sign up at localhost:3001. New local accounts get 50 test credits (`npm run dev:credits -- you@email.com 20` adds more).
7. Make one product video and one reel, end to end. On a Mac the container runs under emulation, so a 20-second video
   takes a while.

To see the UI without any keys, run `npm run demo` (sample data on port 3100).

## How we work

- **Branch, then open a pull request to `main`.** Don't push to `main` directly, and don't deploy: Syed deploys.
- **Test locally first** (`npm run dev:all`), never on hyped.video.
- **Never commit secrets.** `.env`, `.env.*` and `.dev.vars` are git-ignored; keep it that way. Don't paste keys into
  code, chats or issues.
- **Keep the video bucket private.** The render Worker serves only the finished video, poster and captions
  (`serveMedia`); never make R2 public.
- **Containers stay keyless.** The agent runs untrusted websites and repos, so nothing secret may go into a container
  (see README "Security").
- **Database changes:** edit `packages/core/prisma/schema.prisma`, run `npm run db:push` locally, and tell Syed:
  production needs `npm run prod:db`.
- Type-check before a PR: `npx tsc --noEmit` in `web/`, `render/` and `runner/`.

## Where things stand

- Most recent work is on the `launch/caption-styles` branch (it's what's live). It still needs merging into `main`.
- **Reels editor:** shipped. It has caption styles, fonts and animations, B-roll, Ask AI and more.
- **Product video editor:** built, being tested. New product videos get their captions added after the agent, so
  they can be restyled. "Edit video" opens the reel editor in the video's own shape.
- **Ideas next:** animated emoji, a progress bar, saved styles and brand kits, reframing to vertical, 4K/60.

## Handy commands

| Command | What it does |
|---|---|
| `npm run dev:all` | Everything locally (site on 3001) |
| `npm run demo` | The UI with sample data, no keys (3100) |
| `npm run keys` | Checks the AI keys |
| `npm run dev:credits -- you@email.com 20` | Adds test credits |
| `npm run dev:reset` | Wipes local users, videos and credits |
| `npm run measure -- --type demo https://example.com` | Makes a video from the terminal, without the site |

Questions: ask Syed.
