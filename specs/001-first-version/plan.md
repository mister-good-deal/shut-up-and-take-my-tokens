# Implementation Plan: First real version

**Branch**: `001-first-version` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-first-version/spec.md`

## Summary

Turn the prototype into a published first version, local path only, built for dozens of agents working in parallel. The page
finds an issue nobody is working on and offers the tools directly, two clicks from the badge. The copied command claims the
issue with a comment before the agent starts, and conflicts resolve without a coordinator. An `llms.txt` lets an agent do all of it
without a browser. Everything stays static, and publishing is the last step.

The cloud path left this version at GATE 2: a session cannot read the issue, and the maintainer kept the constitution's ban on
putting issue text in a prompt built by the page. What was learned stays in [research.md](research.md).

## Technical Context

**Language/Version**: JavaScript modules, HTML, CSS. Node 24 for tests and CI only.

**Primary Dependencies**: None. At runtime: GitHub's public interfaces. For the user: `gh` and their own agent.

**Storage**: None.

**Testing**: `node lib.test.mjs` through `npm test`; real browser pass; real-product checks ([quickstart.md](quickstart.md)).

**Target Platform**: Current browsers, GitHub Pages. Commands target bash and zsh.

**Project Type**: Static web page with plain-text agent instructions.

**Performance Goals**: 3 anonymous API calls per visit, so about 20 visits an hour per address. Each visitor counts against their own address, so dozens of contributors do not share the limit.

**Constraints**: No build step, no runtime dependency, no third party on page open, command on one line.

**Scale/Scope**: One page, one logic module, one instructions file. 100 labelled issues, 100 open pull requests and the 100
latest comments of the last 24 hours read per project.

## Constitution Check

*Checked again after the GATE 2 decisions.*

| Principle | Status | How |
|---|---|---|
| I. Fewest Interactions | Pass | 2 clicks from badge to copied command. Tools shown directly, issue picked by the page. Each remaining interaction has an accepted reason (below). |
| II. AI First | Pass | `llms.txt`, agent setup, plain-text file; a test keeps the instructions and tasks together. Claims through GitHub comments, conflicts resolved by the earliest comment with nothing asked of anyone, 24-hour expiry, random pick to spread arrivals. Commands and tested code first, workflow only for what adapts at run time (table below). |
| III. Easy Install, GitHub Native | Pass | One file and one label; board and limits left to GitHub. |
| IV. No Backend | Pass | Static files only; credentials never touched. |
| V. Maintainer Opt-In | Pass | No file, no offer; label required. |
| VI. Contributor Consent | Pass | Riskiest level needs an explicit selection next to its warning; one line; nothing runs before Enter. |
| VII. Untrusted Inputs | Pass | Tasks hold only the validated repository and issue number. Issue titles reach the DOM as text only. |
| VIII. Verified On The Real Product | **Deviation accepted** | See Complexity Tracking. Gemini CLI is marked unverified. |
| IX. Least Code | Pass | No dependency. Decisions live in `lib.js` (`liveClaims`, `pickIssue`, `pageState`) and are tested; `page.js` only wires the DOM. |

**Interactions kept, with their reason** (principle I):

| Interaction | Reason |
|---|---|
| Choosing a tool | Contributor Consent: only they know what they run |
| Paste and Enter | Contributor Consent. It also approves the claim comment, which the visible command posts, so the agent asks nothing for it. |

**Commands first, workflow for the rest** (principle II):

| Step | Form | Why |
|---|---|---|
| Pick an issue | Tested code in the page | Deterministic, checked by `npm test` |
| Check the tool, fork, clone | Command | Deterministic, stops on the first failure |
| First claim | Command, before the agent starts | Runs whatever the agent does afterwards, and a failure stops everything |
| Did I win the claim? | Workflow with an exact command | Decides what the agent does next |
| Move to another issue | Workflow with exact commands | Only known at run time |
| Do the work, deliver | Workflow | The agent's job |

## Project Structure

### Documentation (this feature)

```text
specs/001-first-version/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/public-interfaces.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html                  # Markup, styles, CSP. Inline script moves out, Google Fonts links and cloud button go.
page.js                     # New: DOM wiring only, no decisions
lib.js                      # All decisions: params, options, pickIssue, pageState, task, commands. Cloud code goes.
lib.test.mjs                # npm test
llms.txt                    # New: plain-text instructions for agents
fonts/                      # New: 3 woff2 files and their licence
TAKE_MY_TOKENS.md           # New: this project's own opt-in
README.md                   # Status, badge, verified behaviour only
.github/workflows/ci.yml    # Installs zsh, so the tests run the command under it too
.github/workflows/pages.yml # New: test, copy served files, deploy
```

**Structure Decision**: flat, as the prototype. Files stay at the root because GitHub Pages serves them as they are, and only
the listed ones are copied to `_site`.

## Design Notes

- **`lib.js` deletions**: `cloudUrl`, `DELIVERY`, the `cloud` option and the "any issue" task variant, since the page now
  always names an issue. A `cloud:` key already in a file is ignored like any unknown key, so bringing the cloud back later
  breaks nobody.
- **Page**: the cloud button and `<details id="local">` go, so tools show directly under the chosen issue. The validated look
  stays, so no prototype round is needed.
- **Claims** ([research R11](research.md)): the page only reads them. The copied command writes the first one under the
  contributor's account and hands its address to the agent, which writes any further one. There is no release step: a claim expires by age, and an agent that stops leaves it in place, so nobody repeats a failed
  attempt right away. The race is settled in the agent, because only the agent can write; the random pick only makes it rare.
- **`RULES` and `claimSteps`**: exported text used by the task and checked against `llms.txt`.
- **Badge**: shields' count by label, so the README shows live work. It needs no code of ours.
- **Setup task**: three or four questions, under the limit in SC-004: tools, running without prompts, the project board if
  there is one, and which proposed issues to approve. It tells the maintainer that each labelled issue is room for one agent.
- **Publishing order**: gates green, then the pull request, then the maintainer enables Pages and merges, then check P7 on
  the public address. The README's status line changes in the same pull request, since merging is what publishes.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle VIII: a capability must be checked "signed in as a contributor without write access to the target repository". Real agents run on a sandbox repository the maintainer's account owns, so they have write access there. | The account owns every project it could create and owns no organisation. Accepted by the maintainer. | A second account and an organisation were offered and not chosen. |

Every step that differs for a non-collaborator was run by hand on `octocat/Spoon-Knife`, with no write access: claim comment, fork,
push and draft pull request ([research R10](research.md)). What is not observed is a real agent running the whole loop that way, and
the README says so, as principle VIII requires of anything unverified.
