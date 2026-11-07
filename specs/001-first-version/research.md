# Research: First real version

Facts come first, with their evidence, because the constitution (VIII) refuses vendor claims that were not checked on
the real product. All tests ran on 2026-11-07, signed in on claude.ai and GitHub as an account with read-only access to
`octocat/Spoon-Knife`.

## R1. What a cloud session can do for a contributor without write access

**Decision**: the cloud left this version at GATE 2 (see R2). If it returns, the session works on the contributor's fork,
fetches the project with git, pushes to the fork, and ends with a link opening the project's pull request form, filled in.
The contributor makes the last click.

**Evidence**

| Check | Result | Session |
|---|---|---|
| `?prompt=` fills the composer | Yes, nothing is sent | all |
| `repositories=<third party>` | Dropped silently; the picker cannot find it either | first test |
| `repositories=<fork>` right after forking, app not installed | Not preselected | first test |
| `repositories=<fork>`, app installed | Preselected with its branch | `session_01Rx6NWadFfHRS1xnGC8jygu` |
| Push to the fork, app not installed | 403 "Claude doesn't have GitHub access" | `session_01Rx6NWYR58BtbiLMZ4r9jzb` |
| Push to the fork, app installed | Works, also for a branch name the session did not create | `session_01Rx6NWadFfHRS1xnGC8jygu` |
| `gh api repos/<fork>` | Works, returns `fork` and `parent` | same |
| `POST repos/<fork>/merge-upstream` | 403 "Write access to this GitHub API path is not permitted through this proxy" | same |
| `git fetch https://github.com/<project>.git main` | Works, and a branch built on it pushes to the fork | `session_01Rx6NWY2rPrkzmaQdHgba7m` |
| `gh api repos/<project>/issues` | 403, also after `add_repo` read (`read_available`: git only) | `session_01Rx6NWadFfHRS1xnGC8jygu` |
| `add_repo` push, fork named like the project | Refused: same-named repositories cannot share a session | same |
| `add_repo` push, fork renamed | Refused: "you need push access" | `session_01Rx6NWY2rPrkzmaQdHgba7m` |
| `POST repos/<project>/pulls` | 403 in both cases | both |
| `github.com/<project>/compare/main...<user>:<fork>:<branch>?expand=1&title=…&body=…` | Opens the form, title and description filled in | checked in Chrome, nothing created |

**Alternatives rejected**: opening the pull request from the session (refused above, renaming the fork changes only the
error); a fork made by the session (`gh api` writes are refused).

**Still unverified**: `git fetch … HEAD` instead of `main`; the session's own "Create a PR" button on a fork; the first
connection of a Claude account to GitHub, since the test account was already connected.

## R2. How the cloud agent learns what the issue says

**Decision**: not built. The only working design is below, and it needs principle VII amended. The maintainer refused the
amendment at GATE 2, so the cloud leaves this version.

**Design if the principle changes one day**: the page reads the issue and passes it in the task, as a JSON string, placed last.

**Evidence**: from a session, on an existing issue (`session_01Rx6NWaUuMtR3DRqspfAoqs`): `curl` on the github.com issue
page gets 403, `curl` and web fetch on api.github.com get 403, and web fetch on the github.com page returned only the
address and number, with no title the session could confirm. `raw.githubusercontent.com` answers 200, but issues do not
live there.

**Why JSON**: `JSON.stringify` escapes every `"`, so issue text cannot close its own delimiter, and it needs no invented
quoting. Invisible characters (`\p{C}`, which covers bidi controls and lone surrogates) are removed first, so the text
the contributor reads is the text the agent gets.

**Rejected**: a closing tag as delimiter (text can forge it), a random delimiter (not testable, adds nothing over JSON),
no issue text (the agent could not know the work).

## R3. How long the cloud link can be

**Finding, for a later version**: keep the whole link under 10,000 encoded characters and cut the issue text to fit.

**Evidence**: on claude.ai, a link of about 11,700 encoded characters (6,012 characters of prompt) arrived whole. One of
about 38,900 was cut **silently** at 14,335 characters. The limit sits between the two, so 10,000 stays on the verified
side. With the issue text last, a vendor cut would lose text and not instructions.

**Note**: cut before encoding and before removing invisible characters, so that a surrogate pair split by the cut cannot
make `encodeURIComponent` throw.

## R4. How the page reads GitHub without an account

**Decision**: anonymous reads, one raw file and three API calls per visit:

- `raw.githubusercontent.com/<repo>/HEAD/TAKE_MY_TOKENS.md`: not an API call, with `access-control-allow-origin: *`.
- `api.github.com/repos/<repo>/issues?labels=take-my-tokens&state=open&sort=created&direction=asc&per_page=100`: it answers
  both "is this issue approved" and "which is the oldest". Pull requests appear in that list and are filtered out.
- `api.github.com/repos/<repo>/pulls?state=open&per_page=100`: `#N` and `/issues/N` in titles and bodies give the issues
  already taken.
- `api.github.com/repos/<repo>/issues/comments?since=<24h ago>&sort=created&direction=desc&per_page=100`: live claims (R11).

**Evidence**: the public API answered 200 with `access-control-allow-origin: *` and `x-ratelimit-limit: 60`, so about 20
visits an hour per address. A 403 or a network error reads as "could not check, try again later".

**Ceiling**: 100 labelled issues and 100 open pull requests. Beyond that, an issue could be missed or offered twice, and
the local agent's own check still catches it. Paginate if a real project hits this.

**Rejected**: the search API (10 requests a minute), GraphQL (needs a token), one timeline request per issue (spends the
limit), a GitHub Action writing a list (needs installing, against principle III).

## R5. Local command on owned, forked and renamed repositories

**Decision**:
`AGENT --version >/dev/null && { gh repo fork R --clone -- NAME || gh repo clone R NAME; } && cd NAME && CLAIM=$(gh issue comment N --repo R --body 'MARKER …') && AGENT 'TASK'"$CLAIM"`

The first step makes a missing tool stop everything with the shell's own message, before anything is forked or posted. The claim
sits in the command so that it does not depend on the agent, and its address reaches the agent so it can tell its comment from
another's.

**Evidence** (gh 2.103.3, real runs):

- Owned repository: `gh repo fork` fails with "A single user account cannot own both a parent and fork". The fallback line
  clones it and reaches the folder.
- Renamed fork: without a folder argument gh clones into `spoon-knife-fork`, so `cd` would fail. With `-- Spoon-Knife` the
  folder is right, and `origin` and `upstream` are still set.
- If the folder already exists, both the fork and the clone fail and nothing else runs, so no claim is posted.

The task fetches the project by URL rather than from `upstream`, so it reads the same whichever case applies.

## R6. Which tools can be verified end to end

| Tool | Here | Flags | Status |
|---|---|---|---|
| Claude Code 2.1.319 | Installed | `--permission-mode`, `--dangerously-skip-permissions` in `--help` | Verifiable |
| Codex CLI 0.160.0 | Installed | `--approve-for-me`, `--dangerously-bypass-approvals-and-sandbox` in `--help` | Verifiable |
| Gemini CLI | **Not installed** | Documented only | Marked unverified on the page unless it gets tested |

## R7. Agent instructions

**Decision**: a plain-text `llms.txt` at the site root, pointed to from the page (`<link rel="alternate">`, a `<noscript>`
line, a visible link) and the README. An agent fetching the page without running JavaScript still finds it.

**Keeping it true (FR-028)**: `lib.js` exports the shared rules and the setup steps, and `npm test` fails if one of them
is not verbatim in `llms.txt`. There is no build step, so generating the file is not an option.

**Rejected**: an `AGENTS.md` (that name means instructions for working on a repository, not for using a product); fetching
instructions in the copied commands (the maintainer must read what runs, and some agents have no network by default).

## R8. No third party on page open

**Decision**: self-host the three font files, and enforce the rule with a Content-Security-Policy `<meta>`:
`default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src https://raw.githubusercontent.com https://api.github.com; base-uri 'none'; form-action 'none'`.

The browser then enforces FR-006 itself, and an issue title cannot run even if a bug put it in the DOM. Forbidding inline
scripts means moving the DOM code from `index.html` to `page.js`.

**Fonts** (latin subset, from `fonts.gstatic.com`, SIL Open Font License, licence text shipped alongside): Alfa Slab One
400, Atkinson Hyperlegible 400 and 700. **Rejected**: system fonts; the display face is the identity of the validated
design.

**Badge**: `img.shields.io/github/issues/<repo>/take-my-tokens?label=take%20my%20tokens&color=E5B53F`, which shows the live
count of approved open issues (checked on `cli/cli`: "take my tokens: 271 open"). The page only shows the snippet and never
loads the image, and on README pages GitHub proxies images, so readers do not contact shields. Self-hosting could not show a
live count without a server.

## R9. Publishing

**Decision**: `.github/workflows/pages.yml` runs `npm test`, copies only the served files to `_site`, then
`actions/upload-pages-artifact@v5` and `actions/deploy-pages@v5` (latest releases checked). No `.nojekyll` is needed with
artifact deployment. Pages must be enabled once with `build_type=workflow`: an outward-facing step for the maintainer's
approval, right before the merge.

## R11. How dozens of agents avoid the same issue

**Decision**: a claim is a comment on the issue, starting with `take-my-tokens:claim`, posted by the copied command before the
agent starts, and by the agent itself when it moves to another issue. The earliest live claim owns the issue. A claim lives 24 hours. An open pull request referencing the issue takes over.

| Mechanism | Possible without write access | Page can read it cheaply | Expires | Noise for the maintainer |
|---|---|---|---|---|
| **Comment** | Yes, on an unlocked public issue | Yes: every comment of the repository in one request, with dates | Yes, by date | One notification per attempt |
| Assignment, label | **No**: `GET assignees/<me>` answers 404 on `octocat/Spoon-Knife` | Yes | No | Low |
| Draft pull request at once | Yes | Yes, already read | No, it must be closed | **One pull request per attempt, abandoned ones included**, against principle V |
| Reaction | Yes, and silent | Count only, in the issue list | **No date without one request per issue** | None |
| GitHub Action on `/claim` | Yes | Yes | Yes | Needs installing, against principle III |
| Our own server | Yes | Yes | Yes | Against principle IV |

**Evidence** (real calls, on `cli/cli`): `issues/comments?since=…&sort=created&direction=desc&per_page=100` answers 200 anonymously
with `access-control-allow-origin: *`, giving `issue_url`, `created_at` and `body`. `gh issue view N --json comments` gives
`createdAt` and a `url` carrying the comment id, so an agent can tell whether the earliest claim is the one it just posted. On a
real issue of this repository (comment deleted after): `$(gh issue comment …)` returned the comment's address, the same address
came back from `gh issue view`, and the anonymous API listed the comment with its marker and date.

**Why this holds without a coordinator**: GitHub orders comments, so two agents reading the same issue reach the same answer. The
rule compares comments and not people, so one person running several agents is safe too.

**Why random**: the window between opening the page and the claim lasts a minute or two. Picking at random among K available
issues makes a collision about K times rarer, and a collision only costs the loser moving on.

**Ceilings**: the 100 latest comments in 24 hours (`cli/cli` reaches that, and the agent's own check catches a miss, at the price
of one wasted start). Claims are cooperative: a person can post them to block a project, and the maintainer answers with GitHub's
tools. An agent working past 24 hours without a pull request could be joined by another.

**How sure the workflow part is**: agents are told the exact commands and when to stop, and P8 runs the race for real with two
different tools. That gives near certainty and not proof, which is why the first claim and the issue pick are not left to them.

## R12. What real agents did

Real runs on 2026-11-07, on `mister-good-deal/take-my-tokens-sandbox`, with the commands the page copies at the "Less often" level.

| Run | Result |
|---|---|
| Claude Code and Codex on issue #1, started in the same second | The claims landed one second apart. Claude Code held the older one and delivered draft pull request #7. Codex read that it had lost, moved to #4 with no question, claimed it and delivered #9 |
| Claude Code started on #6, not approved | Left it alone, moved to #2, delivered #8 |
| Claude Code started on #5, deliberately vague | Explained on the issue what was missing and stopped, leaving its claim |
| The page afterwards, untouched files, real GitHub | "1 issue free, 4 being worked on", offering #3, the only free one |
| Claude Code given only the `llms.txt` address | Followed it up to the claim, where the auto mode of Claude Code refused the comment as an external write. **Correct behaviour**: the request came from a web page, not its owner |
| Same, with the owner's permission in the sentence | Found #3, the only issue free, claimed it, delivered draft pull request #10 |
| Claude Code asked about `octocat/Spoon-Knife`, which has no file, with `llms.txt` only and read-only orders | Answered that the project has not opened itself to agents and stopped there. Asking it to write was refused by this session's permission system, so this run only shows the stop, not a stop from a run allowed to write |
| Claude Code with the copied setup command, the maintainer answering | 3 questions, the project board one skipped as there is none. Recommended against running without prompts and, when the maintainer chose it anyway for the test, flagged that in the pull request. Pull request #11 holds the file and the badge with the right repository, and the page reads the file |
| Claude Code asked to set up a clone of the sandbox with `llms.txt` only, its answers in the sentence, local files only | Wrote a `TAKE_MY_TOKENS.md` based on the repository and the badge with the right repository, and the page reads the file as `claude, codex`, no skip. It also warned that issues outside the approved list still carried the label. The label and the pull request were left out on purpose |

**What changed because of this**: the README gives the sentence to tell your agent, with the permission in it, and `llms.txt` tells an agent to stop and ask its owner when its tool refuses.

**Environment notes**: the first Codex attempt failed before doing anything, because the default model of this machine's `~/.codex/config.toml` is refused for a ChatGPT account. It reran with `-m gpt-6-luna` and the same task. Codex's `--approve-for-me` sandbox blocks the network at first, and its automatic review then allowed the `gh` commands. Without flags, each tool uses its owner's own settings, so "before anything risky" is only as cautious as those.

## R10. Contributor who cannot be simulated

**Decision**: principle VIII asks for a check "as a contributor without write access", on a project that has opted in, and this
account owns every such project it could create, and owns no organisation. So the check has two halves:

- **Real agents, end to end**, on a sandbox repository the account owns. This covers the claims, the race and the delivery, through
  the owner's clone.
- **Every step that differs for a non-collaborator, run by hand** on `octocat/Spoon-Knife`, where the API reports `push`, `triage`
  and `admin` all false, with the maintainer's approval:

| Step | Result |
|---|---|
| `CLAIM=$(gh issue comment 42131 --repo octocat/Spoon-Knife --body …)` | Works, returns the comment's address (comment deleted right after) |
| `gh issue view … --json comments` and the anonymous API | Both find the claim |
| `gh repo fork … --clone -- Spoon-Knife`, with the fork renamed | Folder right, `origin` is the fork |
| `git fetch https://github.com/octocat/Spoon-Knife.git HEAD`, branch, push to `origin` | Works |
| `gh pr create --draft --repo octocat/Spoon-Knife --head mister-good-deal:take-my-tokens-test-3` | Draft pull request [#42133](https://github.com/octocat/Spoon-Knife/pull/42133), closed right after |

**The gap that remains**: a real agent running the whole loop as a non-collaborator has not been observed. The README says so.
