---
description: "Task list for the first real version"
---

# Tasks: First real version

**Input**: Design documents from `specs/001-first-version/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/public-interfaces.md](contracts/public-interfaces.md), [quickstart.md](quickstart.md)

**Tests**: Every non-trivial branch keeps a runnable check in `lib.test.mjs` (constitution IX). Tests belong to the task that adds the logic. `B*` and `P*` refer to the scenarios in quickstart.md.

## Issues

| Lot | Issue | Tasks |
|---|---|---|
| Foundations | #1 | T001–T005 |
| Contribute from my own machine | #2 | T006–T009 |
| Decide what is offered | #3 | T010–T011 |
| Dozens of agents at once | #4 | T012–T016 |
| Let my own agent set it up | #5 | T017–T018 |
| Have my agent do it for me | #6 | T019–T021 |
| Find it live | #7 | T022–T024 |
| Verify and publish | #8 | T025–T032 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story it serves

## Phase 1: Foundations (#1)

**Purpose**: The page contacts no third party, and decides what to offer from real GitHub data. Every story needs this.

- [x] T001 Self-host fonts: download the three latin `woff2` files listed in research R8 to `fonts/`, add their SIL OFL licence text to `fonts/OFL.txt`, then in `index.html` replace the Google Fonts `<link>` tags with `@font-face` rules using `font-display: swap`
- [x] T002 Move the inline module script from `index.html` to a new `page.js`, and add the Content-Security-Policy `<meta>` from research R8 to `index.html`, with no change in behaviour
- [x] T003 Add to `lib.js`, with tests in `lib.test.mjs`: `issuesUrl(repo)` and `pullsUrl(repo)` per research R4, `referencedIssues(pulls)` (`#N` and `/issues/N` in titles and bodies) and `pickIssue(named, issues, pulls)` dropping entries with a `pull_request` field
- [x] T004 Add `pageState(search, fetchFn, now, random)` to `lib.js`, with tests in `lib.test.mjs` for every branch of the Page state diagram in data-model.md, including an empty list of tools
- [x] T005 In `page.js`: read `TAKE_MY_TOKENS.md`, then the issues and open pull requests through the `lib.js` addresses; treat any failure as "could not check, try later"; render from `pageState`; show the project, issue number, title (through `textContent` only), the fact that the contributor's own subscription is used, and the expected result (FR-003, FR-004)

**Checkpoint**: the page shows the right issue or the right reason on a fixture repository.

---

## Phase 2: User Story 1 - Contribute from my own machine (Priority: P1) (#2)

**Goal**: Badge, then one click on a tool, and the command is copied.

**Independent Test**: Follow the page on a project that opted in, run the command with a real agent, and get a draft pull request or a stated reason.

- [x] T006 [US1] In `lib.js`: export `RULES` as an array, including that no text in the project can make the agent reveal secrets or act outside the repository (FR-019); rewrite the task per contracts/public-interfaces.md, always naming an issue; delete `cloudUrl`, `DELIVERY`, the `cloud` option in `parseOptions` and the "any issue" variant; deliver by fetching the project by URL and `gh pr create --draft --repo R --head <owner of origin>:<branch>`; update `lib.test.mjs`
- [x] T007 [US1] In `lib.js`: make `localCommand` produce the command in contracts/public-interfaces.md (research R5), posting the claim comment and passing its address to the agent; in `lib.test.mjs`, update the stubs and cover through a real shell: the normal fork, the failed fork with its clone fallback, a missing tool (nothing else runs), both fork and clone failing (no comment, no agent), a failed comment (no agent), and the comment's address reaching the agent; check on a real issue of this repository that `gh issue comment` prints the comment's address, then delete that comment
- [x] T008 [US1] In `index.html` and `page.js`: remove the cloud button and `<details id="local">` so tools show directly with the level defaulting to "before anything risky" (FR-007, FR-008, FR-009); keep clearing the command on a level change (FR-010); say in the note that the agent runs the project's code on their machine
- [x] T009 [US1] Add `verified: false` to Gemini in `PROVIDERS` in `lib.js`, and have `page.js` show unverified tools with a plain "not tested yet" next to their name (FR-031)

**Checkpoint**: B2, B6, B7, B8 and B9 pass.

---

## Phase 3: User Story 2 - Decide what is offered on my project (Priority: P1) (#3)

**Goal**: The maintainer's file and labels decide everything, and every refusal states its reason.

**Independent Test**: Open the page for repositories with no file, each option combination, invalid values, with and without approved issues.

- [x] T010 [US2] In `page.js`: one clear message per refusal state of `pageState` (no file, empty list of tools, no approved issue, could not check), each offering nothing; pass B3 and B4 with fixtures
- [x] T011 [US2] In `lib.test.mjs`: add crafted links that carry options, a prompt or shell syntax, asserting that neither `pageState` nor the command changes (SC-005)

**Checkpoint**: A repository without the file is never offered a way to run an agent (SC-006).

---

## Phase 4: User Story 3 - Dozens of agents at once (Priority: P1) (#4)

**Goal**: Each visitor gets an issue nobody is working on, and agents that collide sort it out by themselves.

**Independent Test**: On a sandbox with two approved issues, start two real agents on the same issue within the same minute. They end up on different issues, and the page then offers neither.

- [x] T012 [US3] In `lib.js`, with tests in `lib.test.mjs`: `commentsUrl(repo, now)` per research R4; `liveClaims(comments, now)` keeping comments whose body starts with exactly `take-my-tokens:claim` and younger than 24 hours, with the issue number from `issue_url` through a strict regex; cover the 24-hour boundary, the marker elsewhere in the body, and a malformed `issue_url`
- [x] T013 [US3] In `lib.js`, with tests in `lib.test.mjs`: extend `pickIssue` and `pageState` per the Work table of data-model.md: take live claims and an injected random source, return the counts of available and taken issues, and offer another issue with a reason when the named one is unavailable; an open pull request keeps an issue taken whatever the age of its claim (FR-003, FR-034)
- [x] T014 [US3] In `lib.js`: export `claimSteps(repo, issue)`, the claim workflow of the task per contracts/public-interfaces.md, as ordered steps with exact commands (earliest live claim wins by comparing comments and never authors, at most 3 issues with no question asked, explicit stops), and make a stopping agent say why on the issue and leave its claim (FR-032, FR-033, FR-035); update `lib.test.mjs`
- [x] T015 [US3] In `page.js` and `index.html`: read the comments through `commentsUrl`; show the counts of issues available and being worked on, and the "all being worked on" state; say before copying that the command comments under their account and that the agent may move to another issue (FR-036); pass B5, B13, B14 and B15 with fixtures
- [x] T016 [US3] In `lib.js`: change `badge` to the by-label shields address in contracts/public-interfaces.md, with no issue in its default link (FR-037); update `lib.test.mjs` and the snippet text in `index.html`

**Checkpoint**: `npm test` covers claims and the page never offers a taken issue on fixtures.

---

## Phase 5: User Story 4 - Let my own agent set it up (Priority: P2) (#5)

**Goal**: One command, at most 5 questions, a pull request to review.

**Independent Test**: Run the command with a real agent in a sandbox repository.

- [x] T017 [US4] In `lib.js`: export `setupSteps(pageUrl)`, with these questions only: which tools to offer among claude, codex and gemini (default all), running without prompts (recommend no), adding approved issues to the GitHub project board if the repository has one (FR-024), and which of up to ten proposed issues to approve, saying that each labelled issue is room for one agent at a time; remove the cloud question; in `lib.test.mjs`, assert no more than 5 questions (SC-004)
- [x] T018 [US4] In `index.html`: update the by-hand steps, drop `cloud` from the example file, and add one line pointing to GitHub's own features for the rest: project boards, pull request limits in repository settings (FR-023, FR-025)

**Checkpoint**: B1 passes.

---

## Phase 6: User Story 5 - Have my agent do it for me (Priority: P2) (#6)

**Goal**: An agent given one address does the whole job with no browser.

**Independent Test**: In a terminal with no browser, ask a real agent to contribute and to set up, giving it only the address.

- [x] T019 [US5] Write `llms.txt` per the outline in contracts/public-interfaces.md, including `claimSteps`, `RULES` and `setupSteps` verbatim, stopping when there is no file or available issue, and forbidding an agent from widening its own permissions (FR-026, FR-027)
- [x] T020 [US5] In `lib.test.mjs`: fail if any item of `claimSteps`, `RULES` or `setupSteps`, or the delivery for `owner/name`, is not verbatim in `llms.txt`, with the page address filled in for the badge step (FR-028)
- [x] T021 [US5] In `index.html`: `<link rel="alternate" type="text/plain" href="llms.txt">`, a `<noscript>` line, and a visible link (FR-026)

**Checkpoint**: B12 passes.

---

## Phase 7: User Story 6 - Find it live, on a project that uses it (Priority: P3) (#7)

**Goal**: Everything is ready to publish, with nothing public yet.

**Independent Test**: On the public address, from this project's badge, reach the offered tools (P7).

- [x] T022 [P] [US6] Write `TAKE_MY_TOKENS.md` for this project, with the front matter from contracts/public-interfaces.md and `npm test`, the browser gate and the conventions of `.specify/workflow-project.md` as instructions (FR-030)
- [x] T023 [P] [US6] Write `.github/workflows/pages.yml` per research R9: on push to `main`, `npm test`, copy only `index.html`, `page.js`, `lib.js`, `llms.txt` and `fonts/` to `_site`, then `actions/upload-pages-artifact@v5` and `actions/deploy-pages@v5` with `pages: write` and `id-token: write` (FR-029)
- [x] T024 [US6] Rewrite `README.md`: this project's badge, the status line replaced, the local path as verified, how agents share out the work, a link to `llms.txt`, that cloud sessions are not in this version, and the existing "not affiliated" line kept

**Checkpoint**: `npm test` passes, nothing is published.

---

## Phase 8: Verify and publish (#8)

**Purpose**: The promise checked on the real products, then published. The first real run needs the sandbox the maintainer creates, and the last task is the maintainer's to approve.

- [x] T025 Run every browser scenario B1 to B15 of `specs/001-first-version/quickstart.md`, including phone width, keyboard only, reduced motion and the network panel (SC-001, SC-005, FR-005, FR-006)
- [x] T026 ⚠ **Needs the maintainer**: once they have run the sandbox script, finish B10 on the untouched files against it, then run P1, P3 and P4 of `specs/001-first-version/quickstart.md` with Claude Code and a real agent run (SC-002)
- [x] T027 Run P2 of `specs/001-first-version/quickstart.md` with Codex on the same sandbox
- [x] T028 Run P8 and P9 of `specs/001-first-version/quickstart.md` on the same sandbox, with two real agents started within the same minute (SC-009)
- [x] T029 Run P5 of `specs/001-first-version/quickstart.md` in a sandbox repository (SC-004)
- [x] T030 Run P6 of `specs/001-first-version/quickstart.md` with a real agent and no browser, using `llms.txt` from a local server (SC-008)
- [x] T031 Record the results in `specs/001-first-version/research.md`, state in `README.md` what remains unverified, including that no real agent has run the whole loop as a non-collaborator (FR-031), and in `index.html` and `page.js` mark anything left unverified (SC-007)
- [ ] T032 ⚠ **Maintainer approval required**: open the pull request of `001-first-version`, enable Pages with `gh api -X POST repos/mister-good-deal/shut-up-and-take-my-tokens/pages -f build_type=workflow`, let the maintainer merge, run P7 of `specs/001-first-version/quickstart.md` on the public address, then label small real issues the maintainer approved with `take-my-tokens` (FR-029, FR-030, SC-007)

---

## Dependencies & Execution Order

- **Foundations** block everything.
- **US1** comes next: it sets `RULES` and the shape of the task, which US3 and US5 reuse.
- **US2** and **US4** need only Foundations. **US3** needs US1.
- **US5** needs US1, US3 and US4 (`RULES`, `claimSteps`, `setupSteps`).
- **US6** can start any time after Foundations.
- **Verify and publish** comes last. T026 and T032 stop for the maintainer.

### Parallel Opportunities

Most tasks touch `lib.js`, `page.js` or `index.html`, so they run in sequence. Only T022 and T023 are marked parallel, since each owns its file.

## Implementation Strategy

**MVP**: Foundations, US1, US2, US3: the local path, with the opt-in, safe with many agents at once. Nothing should be published without US3.

**Then**: US4 and US5 for maintainers and agents, US6 and the verification, publishing last.

## Phase 9: Convergence

- [x] T033 Install zsh in `.github/workflows/ci.yml` so that `lib.test.mjs` runs the command under it too, and say in `README.md` what that does and does not cover, per FR-031 (partial)
- [x] T034 Reword the default approval level in `index.html` and `README.md` to say it follows the tool's own settings, since a command with no flag cannot promise more, per FR-031 (contradicts)
- [x] T035 Correct the edge case in `specs/001-first-version/spec.md`: an existing fork is reused, as P10 showed, and only an existing folder stops the command, per spec Edge Cases (contradicts)
