# Workflow project file — read by /dev-workflow, /bug-workflow and /idea-workflow

## PROJECT VCS NOTE

- Integration branch: `main`. Never commit on it: features go on the `NNN-short-name` branch `speckit-specify` cuts,
  fixes on `fix/<short-name>`, one PR per feature or fix, targeting `main`. There is no version to bump: this is a static
  page with no releases.
- Commits: a targeted `git commit`, staging files by name, never `git add -A`. End messages with the session's
  Co-Authored-By trailer. Pushes and PRs only on the maintainer's explicit request.
- Tracked artifacts: `specs/<feature>/`, `.specify/bugs/<id>-<slug>/` and `.specify/assessments/<slug>/` are committed
  with the work they describe.
- Prototypes: a visual choice is settled by 2–3 static pages under `specs/<feature>/prototypes/`, served with
  `python3 -m http.server` and shown next to the terminal with the `terminal-browser` or `vitrine:disposition` skill.

## PROJECT GATES

- Always: `npm test`, `npm run typecheck`, `npm run lint` and `npm run knip`, which CI also runs on every pull request.
  Read their output rather than their exit code.
- When `index.html` changes: a pass in a real browser (`terminal-browser`) covering the affected states, the clipboard
  content, crafted links and a phone width.
- When a link to a vendor's product changes: check it on the real product, signed in as a contributor without write
  access. Vendor docs have been wrong about this before.
- A skipped gate is reported as skipped, never as green.

## PROJECT TRACKER NOTE

- Tracker: GitHub issues of the repository `origin` points to, public. `gh issue create --title … --body … --label …`,
  read with `gh issue view N --comments`, edit with `gh issue edit N`. Body in English: `## Goal` / `## Tasks`
  (checklist) / `## Acceptance` / `## Depends on` / `## References` (spec, plan and tasks paths).
- Milestones: none until a first public launch is planned.
- Parent: none by default. A lot issue stands alone unless `--parent` names a meta-issue.
- Dependencies: written as `Blocked by #N` in the description.
- Labels: one kind label (`feature`, `bug`); lifecycle `in-progress` while being worked on, then `ready` when its PR
  awaits review.
- PRs reference issues with `Refs #N`, never `Closes` or `Fixes`, so nothing auto-closes.
- Closure: only the maintainer closes an issue. The maintainer validates the bug gate.
- Human gates: the three gates of /dev-workflow, nothing beyond them.
- Execution mode: **single-session** (`speckit-agent-assign-execute`), on the feature branch.

## PROJECT VALIDATION PAGES

- Renderer: the `vitrine:lire` skill (`lire.sh <page.md> "<title>"`), in the browser to the right of the terminal. Close
  the tabs after the answer with `terminal-browser action -- tab close <n>`.
- Components: the `lire` stylesheet (`.pipe`, `.ask`, `.gantt`, `.warn-tag`, `.note`), documented in its SKILL.md.
- Who shows: the agent in the direct session does all four steps of `gate.md`.
- Language: French (the ask reads « Ce qu'on attend de toi : »).
