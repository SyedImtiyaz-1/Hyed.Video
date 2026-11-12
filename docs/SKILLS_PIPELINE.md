# The skills pipeline: making and shipping video skills from the admin side

Proposal, 11 November 2026. Taibanaz (product) for Syed (build and deploys), in answer to his ask of 9 November:
"a pipeline that will allow everyone to create a skill that will generate a good video, but on the admin side".
Nothing here is built yet. It builds on `AGENT_SKILLS_RESEARCH` (5 Nov) and the launch plan; decisions are at the end.

## In one minute

Today a skill is a folder of Markdown baked into the runner's container image. Changing one means editing the repo,
building a new image and deploying it, which only Syed can do. Testing it is `npm run measure` on a laptop, and the
grade comes from the model that built the video.

The pipeline gives the team one admin page for the whole loop:

1. **Draft** a skill version in the browser.
2. **Test** it on a fixed set of products, as hidden test jobs.
3. **Score** the test videos with the same gate and critic every video gets (Wave 1).
4. **Compare** them side by side with the live skill.
5. **Publish** it to a share of real jobs, then to all, with rollback.

Skills move out of the image into versioned files in R2. A new skill then needs no deploy, only a publish.

## v2 (Syed, 12 November) and step 1

Syed checked this proposal against the code and sent a v2 (Slack, `updated-plan.pdf`). It keeps the loop and changes:

- **Baseline:** `brag-slim` is version 1 of every scenario (it's what production runs); Hyped's own skills are version 2.
  The first publish is the measured switch from one to the other.
- **Rollout on Standard:** Studio is off in production (`STUDIO_ENABLED` is false), so rollouts start on Standard.
- **Both engines tested:** Codex (Standard) and Claude (Studio) read skills differently; a version passes on each
  engine it will run on.
- **Budget per engine,** enforced by the render Worker: about $25 a day for Standard, $75 for Studio.
- **Numbers:** at least 12 test videos to compare; at least 30 real videos and a week before 100%; automatic rollback
  when the candidate's hard-fail rate over its last 20 videos is 10 points above live's; minutes at most 25% higher.
- **Lint:** also checks every tool a skill calls exists in the runner image, and caps a skill at 120 KB.
- **Approval:** any admin other than the author.
- **"No deploy" is scoped:** text changes ship without one; a skill that needs a new tool waits for an image.
- **Eight decisions** (the six below plus the baseline and where rollouts start), all recommended as above.

**Step 1 is built** (12 Nov, `launch/skills-pipeline`): the schema (`Skill`, `SkillVersion`, `SkillRun`,
`SkillLive`, `Job.skillVersion`, `Job.test`), `packages/core/src/skills.ts` (the slots, the pack format, `lintSkill`),
`web/lib/skills.ts` (packs in the VIDEOS bucket under `skills/`, which `serveMedia` never serves), the admin pages at
`/dashboard/admin/skills` (every skill with its live and newest version; Import, which takes `runner/skills` whole:
`brag-slim` as every scenario's v1, recorded as live, and Hyped's skills as v2; a skill's versions; the editor with
its files, the text and the check, live as you type, Ctrl+S to save a draft), and the routes under
`/api/admin/skills` (admins only). Nothing it does changes what production runs.

## Where we are today

| Part | Today | Where |
|---|---|---|
| Skill files | Ten folders: `brag-slim` and nine `hyped*` skills (core, review and seven scenarios), about 440 KB | `runner/skills/` |
| How they reach a job | Copied into the image (`COPY skills`), then into each workspace's `.claude/skills` and `.agents/skills` | `runner/Dockerfile`, `prepareWorkspace` in `runner/src/agent.ts` |
| Which skill runs | `brag-slim`, unless `HYPED_SKILLS=1`. The render Worker never sets that flag, so production always runs `brag-slim`. | `agent.ts:27` |
| Which scenario | A GitHub change → `hyped-release`; else the template's goal; else the video type | `scenarioSkill` in `agent.ts` |
| Testing | `npm run measure` on a laptop: turns, minutes, cost and review score to a CSV | `runner/src/measure.ts` |
| Grading | The builder grades its own video (`review.json`); the score is recorded, nothing is gated | `runner/src/review.ts`, `hyped-review` |
| Admin side | One page, unit economics and the funnel, for `ADMIN_USER_IDS` | `web/app/dashboard/admin/page.tsx` |

## The pipeline

```
 Admin page (web)                 R2 (private)                   render Worker            runner container
 ───────────────                  ────────────                   ─────────────            ────────────────
 1 Draft  ── save version ──────▶ skills/<skill>/<v>.tar.gz
          (lint on save)
 2 Test   ── test jobs (hidden, ──────────────────────────────▶  job spec names   ──▶  prepareWorkspace unpacks
             admin-paid) ×N URLs                                 skill + version       that version, not the
                                                                 reads the pack         baked-in folder
 3 Score  ◀─ score, hard fails, minutes, cost ◀───────────────── job result     ◀──── gate + critic (Wave 1)
 4 Compare   test videos next to the live version's, plus a human 1–5 rating
 5 Publish ─ live pointer: scenario → version, at 10% then 100% ─▶ picks the version per job
             Rollback = move the pointer back
```

### 1. Draft

- **Admin page** `/dashboard/admin/skills`: one row per scenario (launch, update, ads, explain, dev, release, app). Each
  row shows the live version, its pass rate, its average minutes and cost, and the drafts in progress.
- **Editor**: the skill's file tree (`SKILL.md`, `references/`, `recipes/`) with a Markdown editor. A new version
  starts as a copy of the live one, so a change is a small diff. Each version records who wrote it, a note, and the
  version it came from.
- **Lint on save**, the same checks every time:
  - the frontmatter's name and description are there;
  - every relative link resolves;
  - the size stays under a budget (the research's target: under 40 KB read before the plan);
  - no instructions to fetch from or send to hosts outside the allowed list.
- **Later**: a "Draft with Claude" box, where someone describes the style ("calmer, more product UI, a numeral reveal")
  or pastes a reference video, and Claude proposes the diff.

### 2. Test

- **Run tests**: one click runs the version on the test set. These are the same 8–12 product URLs for every version,
  across the formats chosen: the golden set's products (the 12–13 Nov rating), so scores mean the same thing over time.
- **Test jobs** are ordinary jobs with three extra fields: `test: true`, `skill`, `skillVersion`. They never appear
  in a customer's projects or the funnel, and they're paid from a daily admin budget, not credits.
- **The render Worker** reads the version's pack from R2 and hands it to the container as files, the way private
  repos already arrive. The container stays keyless, and the bucket stays private.
- **In the runner**, `prepareWorkspace` unpacks the pack into `.claude/skills` and `.agents/skills` in place of the
  baked-in folders. The baked-in skills stay as the fallback.

### 3. Score

- Each test video gets what every video gets after **Wave 1** (launch plan, 11–17 Nov):
  - `review.mjs measure` (loudness, black frames, freezes, size);
  - one fix round;
  - the second-model critic on the rubric.
- **Stored per run**: score, passed, hard fails, rounds, turns, minutes, cost. This is a new `SkillRun` row, or the
  job itself with its version.
- **Human rating**: the person testing can add a 1–5 rating. Those ratings keep the critic honest, as the golden set
  does.

### 4. Compare

- **One screen**: the new version's videos next to the live version's on the same products, playing side by side,
  with the numbers above them: pass rate, average score, hard fails, minutes and cost per video.
- **The rule to publish** (proposed): pass rate and average score at least the live version's, no new kind of hard
  fail, and cost per video no more than 20% higher.

### 5. Publish

- **The live pointer**: a small table, scenario → live version, plus an optional candidate at a share of traffic.
- **Rollout**:
  - Publish starts the version on 10% of that scenario's real jobs, Studio first, as the launch plan's A/B does;
  - a week of numbers, then 100%.
- **Rollback**: move the pointer back. It takes effect on the next job, with no deploy.
- **Approval**: a second admin (Syed) approves a publish. Every publish and rollback is logged with who and why.

## Data

| Table | Holds |
|---|---|
| `Skill` | id (`hyped-launch` …), scenario, name |
| `SkillVersion` | skill, version number, R2 key of the pack, parent version, author, note, lint result, status (draft · tested · candidate · live · retired), created |
| `SkillRun` | version, job, product URL, format, score, passed, hard fails, rounds, turns, minutes, cost, human rating |
| `SkillLive` | scenario, live version, candidate version, candidate share, changed by, changed at |
| `Job` (+2 columns) | `skillVersion` (which version made it), `test` (hidden test job) |

The core skill (`hyped`) and `hyped-review` are versioned the same way. A scenario's version pins the core version it
was tested with, so a change to the core is tested against every scenario before it goes live.

## Safety

- **Admins only**: only `ADMIN_USER_IDS` can open the pages or save a version. "Everyone" means the team, not
  customers (decision 1).
- **A skill is instructions to an agent** that runs with full permissions inside the container. So:
  - lint on save;
  - a second admin approves every publish;
  - the container stays keyless with its network as today;
  - a test job can't reach customer data.
- **Packs are in private R2**, read by the render Worker only. They're never served to browsers except through the
  admin editor's own route.

## Building it

Each step is one PR from `main`, behind a flag, with production on today's skills until the numbers say otherwise.

| Step | What | Who | Needs |
|---|---|---|---|
| 1 | Schema (`Skill`, `SkillVersion`, `SkillRun`, `SkillLive`, `Job.skillVersion`, `Job.test`); the admin list and editor; packs to R2; lint. Seeded with today's skills as version 1. | Taibanaz with Claude (web) | `npm run prod:db` |
| 2 | Test jobs: the job spec names a skill version; the render Worker passes the pack; `prepareWorkspace` uses it; test jobs hidden and admin-paid | Syed with Claude (render, runner) | A new runner image, once |
| 3 | Scores into `SkillRun`; the compare screen; human ratings | Taibanaz with Claude (web) | Wave 1's gate and critic |
| 4 | Publish, rollout share, rollback, approval, the log | Both | — |
| 5 | Draft with Claude; reference videos | Later | — |

Steps 1 and 2 can run in parallel with Wave 1. Steps 3 and 4 follow it, since a score is only worth comparing once the
gate and the critic exist. Roughly two weeks for 1–4 at today's pace. The runner image changes once, in step 2; after
that, new skills ship without a deploy.

## Decisions

1. **Who can make skills:** the team on the admin side (recommended), or, later, creators outside the team.
2. **Who approves a publish:** a second admin, Syed at first (recommended), or the author alone if the numbers pass.
3. **Where the files live:** R2, versioned packs (recommended: no deploy per skill); or keep them in the repo and the
   image, with the admin page only for testing.
4. **The test set:** the golden set's products, 8–12 URLs × the formats chosen (recommended); or each author picks.
5. **Test budget:** a daily cap for admin test jobs, about $20 (one 12-URL run at Standard). Studio costs about 3×.
6. **Order:** steps 1–2 now, alongside Wave 1 (recommended); or after Wave 1.
