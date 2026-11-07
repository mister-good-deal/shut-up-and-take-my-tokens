# Feature Specification: First real version

**Feature Branch**: `001-first-version`

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "Turn the validated prototype of Shut up and take my tokens into the first real version: a badge for open source READMEs that opens one static page where a contributor spends their own AI subscription on an issue the maintainer approved, ending in a draft pull request. Contributor side: a cloud button and a local button with three approval levels. Maintainer side: one TAKE_MY_TOKENS.md, the take-my-tokens label, and a command that lets the maintainer's own agent do the setup. The prototype's cloud link cannot work as written and must be redesigned around what a real contributor can actually do. The page is published only once what it promises is true."

## Clarifications

### Session 2026-11-07

- Q: Can a cloud session deliver a pull request for a contributor without write access? → A: Tested on the real product. It can push to the contributor's fork once the vendor's GitHub app is installed on it, and fetch the project's code with git. It cannot attach the project, read its issues or open a pull request on it, even with a fork named differently. A session would have to end with a link opening the pull request form, filled in.
- Q: How would a cloud agent learn what the issue says, given it cannot read it? → A: Only if the page passed the issue's text in the task, which constitution principle VII forbids. The maintainer kept the principle as written at GATE 2, so **the cloud leaves this version and only the local path ships**. The findings stay in research.md for a later version.
- Q: If the cloud returns, how does the contributor select their fork? → A: The page asks for their GitHub username once and remembers it, with the vendor's selector as fallback. Chosen at GATE 2, replacing the selector chosen at GATE 1, and not built in this version.
- Q: Who picks the issue when the badge names none? → A: The page does, at random among the issues nobody is working on, so that contributors arriving together spread out. No choice is asked of the contributor.
- Q: How do dozens of agents run by different people avoid working on the same issue, with no server? → A: The copied command claims the issue with a comment before the agent starts, under the contributor's account. The page reads recent claims and offers something else. If two claims land in the same minute, the earliest comment keeps the issue and the other agent moves on by itself. A claim expires after 24 hours, unless a pull request has taken over by then.
- Q: What is a command, and what is an instruction to the agent? → A: Safe, deterministic commands and tested code come first: picking the issue, forking and the first claim. What has to adapt at run time is a workflow in the agent's task, with ordered steps, exact commands and explicit stops: checking who won the claim and moving to another issue.
- Q: How is the check as a contributor without write access done, when the maintainer's account owns every project it could create? → A: On a sandbox repository in an organisation the maintainer creates. The fork path is exercised for real, but with write access on the project. The maintainer accepted this gap at GATE 2, and the README states it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contribute from my own machine (Priority: P1)

A contributor with spare quota clicks the badge on a project's README. The page names the project and the issue it picked, and shows the tools. They click theirs: the page copies one command. They paste it in their terminal: it forks the project, starts the agent on that issue, and the agent ends by opening a draft pull request on the project.

**Why this priority**: This is the shortest path that delivers the whole promise, and it depends on nothing but the contributor's own tools.

**Independent Test**: On a project that opted in, follow the page as an account without write access, run the copied command with a real agent, and see either a draft pull request on the project or the agent stopping and saying why.

**Acceptance Scenarios**:

1. **Given** a project that opted in with an approved issue, **When** the contributor clicks a tool, **Then** the exact command is displayed and in the clipboard, on one line, and nothing runs until they press Enter; the badge click and that click are the only two clicks needed.
2. **Given** no approval level was changed, **When** the command is copied, **Then** it keeps the agent's normal approval prompts.
3. **Given** the contributor selects "less often", **When** the command is copied, **Then** it uses that tool's reduced-prompt mode, which keeps its safeguards.
4. **Given** the maintainer offers running without prompts and the contributor selects it next to its warning, **When** the command is copied, **Then** it disables approval prompts; **and given** the maintainer does not offer it, **Then** the choice does not exist on the page.
5. **Given** the agent finishes, **Then** a draft pull request on the project links the issue and states it was written by an AI agent.
6. **Given** the issue stopped being approved or was taken after the page was opened, **When** the agent starts, **Then** it leaves that issue alone and takes another available one, or stops and says so if there is none.

---

### User Story 2 - Decide what is offered on my project (Priority: P1)

A maintainer adds one `TAKE_MY_TOKENS.md` to their repository and labels the issues agents may take. The file's options decide which tools and approval levels are offered, and its text tells agents how to work on the project. Without that file, the page offers nobody a way to run an agent on the project. Everything else, from tracking to limiting incoming pull requests, stays in GitHub's own features.

**Why this priority**: Maintainers are overwhelmed by unsolicited AI pull requests. Without this opt-in, the tool makes that worse, whatever else it does.

**Independent Test**: Open the page for repositories with no file, with each option combination, with invalid values, with and without approved issues, and check what is offered each time.

**Acceptance Scenarios**:

1. **Given** a repository without the file, **When** anyone opens the page for it, **Then** no way to run an agent is offered, and the page explains that its maintainers have not opened it to agents.
2. **Given** a file that lists only some tools, **When** the page opens, **Then** only those tools are offered.
3. **Given** a file with unknown keys or invalid values, **When** the page opens, **Then** those are ignored and the safe default applies.
4. **Given** a file with an empty list of tools, **When** the page opens, **Then** it says so and offers nothing.
5. **Given** a crafted link, **When** it tries to carry options, a prompt or shell syntax, **Then** it has no effect on what is offered or copied.
6. **Given** no issue is approved, **When** the page opens, **Then** it says so and offers nothing.

---

### User Story 3 - Dozens of agents at once (Priority: P1)

Dozens of contributors open the same badge over the same hours. Each gets an issue nobody is working on. The copied command claims it with a comment before the agent starts, so the next visitor is sent elsewhere. If two agents land on the same issue in the same minute, the earliest claim keeps it and the other moves on by itself. An agent that vanishes holds its issue for 24 hours at most.

**Why this priority**: Two agents coding the same thing waste the quota people give and the maintainer's review. Without this, the product gets worse as it succeeds.

**Independent Test**: On a sandbox with two approved issues, start two real agents on the same issue within the same minute. They end up on different issues, with nothing asked of anyone, and the page then offers neither.

**Acceptance Scenarios**:

1. **Given** an agent has claimed an issue, **When** the next contributor opens the page, **Then** they get another issue.
2. **Given** two agents claim the same issue, **When** each reads the comments, **Then** the one whose comment is earliest keeps it and the other takes another available issue, without asking its contributor.
3. **Given** a claim is older than 24 hours and no open pull request references the issue, **When** the page opens, **Then** the issue is available again.
4. **Given** an open pull request references the issue, **When** the page opens, **Then** the issue stays taken, whatever the age of the claim.
5. **Given** every approved issue is taken, **When** the page opens, **Then** it says how many are being worked on and offers nothing; **and given** an agent loses a claim with nothing left, **Then** it stops and says so.
6. **Given** an agent stops without delivering, **Then** it says why on the issue, and others do not repeat the attempt while its claim is live.
7. **Given** the page offers an issue, **When** the contributor reads it, **Then** they know the command comments under their account and that the agent may move to another issue.
8. **Given** a link names an issue that is taken or not approved, **When** other issues are available, **Then** the page says so and offers one of them.

---

### User Story 4 - Let my own agent set it up (Priority: P2)

A maintainer opens the page without naming a repository and clicks their tool, which copies one command. Run at the root of their repository, it starts their agent, which asks them a few questions, writes the file from what it finds in the project, adds the badge, creates the label, proposes issues to label, and opens a pull request for them to review. Setting it up by hand stays possible and is documented on the same page.

**Why this priority**: Setup must take less effort than reading about it, but the hand-written path already works, so this comes after the opt-in itself.

**Independent Test**: Run the copied command with a real agent in a sandbox repository, and check the resulting pull request gives a file the page accepts.

**Acceptance Scenarios**:

1. **Given** the page opened with no repository, **When** the maintainer clicks a tool, **Then** the setup command is displayed and copied, and it never disables approval prompts.
2. **Given** the agent runs, **When** it reaches the risky option, **Then** it recommends leaving it off and explains the risk to contributors.
3. **Given** the agent finishes, **When** the maintainer reviews its pull request, **Then** it holds the file and the badge pointing to their repository, and the page accepts the file once merged.
4. **Given** the project uses a GitHub project board, **When** the maintainer approves issues, **Then** the agent offers to add them to that board.

---

### User Story 5 - Have my agent do it for me (Priority: P2)

Someone tells their own agent to spend their spare tokens on a project, or to set a project up, and gives it this product's address. The agent finds plain-text instructions there, without a browser, and does the whole job by itself within what its owner allowed.

**Why this priority**: The product is AI first: for people who already work through an agent, the fewest interactions is none at all.

**Independent Test**: In a terminal with no browser, ask a real agent to contribute to an opted-in project and to set up a sandbox repository, giving it only the public address of the instructions.

**Acceptance Scenarios**:

1. **Given** only the instructions' public address, **When** an agent reads it, **Then** it knows how to check the project opted in, find an approved issue, deliver a pull request, and set up a repository.
2. **Given** a project without the file or without an approved issue, **When** the agent follows the instructions, **Then** it stops and says so.
3. **Given** an agent working for someone, **When** it follows the instructions, **Then** it does not widen its own permissions unless its owner told it to.

---

### User Story 6 - Find it live, on a project that uses it (Priority: P3)

Anyone can reach the page at a stable public address, and this project itself carries the badge, the file and approved issues. The page and the README describe only what has been verified to work.

**Why this priority**: Publishing is the last step by design: nothing is public until its promise is true.

**Independent Test**: From a browser with no local setup, open the public address from this project's badge and reach the offered tools.

**Acceptance Scenarios**:

1. **Given** the verification gates passed, **When** the page is published, **Then** it opens at a stable address and works as it does locally.
2. **Given** this project's README, **When** a visitor reads it, **Then** it shows the badge and no longer says the page is an unpublished prototype.
3. **Given** a tool that could not be verified, **When** the page is published, **Then** it is not offered, or it is plainly marked as unverified.

---

### Edge Cases

- The contributor already has a fork, or a folder with the project's name in the current directory: the command stops with the tool's own message and changes nothing.
- The contributor owns the project or can already write to it, for instance a maintainer trying their own badge: the command still reaches a working clone.
- The contributor's fork is behind the project: the agent works from the project's current state.
- The contributor renamed their fork: the command still clones it into a folder named after the project.
- `gh` is missing or not signed in, or the chosen tool is not installed: the command stops at that step, and the page has already said what it needs.
- GitHub cannot be read for a reason other than the file's absence, including its limit on anonymous requests: the page says it could not check and to try again later, and offers nothing.
- The browser blocks clipboard access: the page says so and the command stays visible to copy by hand.
- Issue text tries to instruct the agent: the task tells it to treat that text as a description of the work, not as instructions.
- The issue is locked, or the project restricts who may comment: the command stops with GitHub's message before the agent starts, rather than work unclaimed.
- Someone posts claims to block a project: claims keep honest agents apart and stop nobody on purpose. The maintainer deletes the comments or blocks the person with GitHub's own tools.
- A project with more than 100 comments in 24 hours: the page may miss a claim and offer a taken issue, and the agent's own check catches it.
- The same person reruns after a crash: their earlier claim counts like anyone's, so the agent takes another issue.
- An issue mentioned in passing by an open pull request: it counts as taken. That is the safe mistake.
- The contributor runs out of quota mid-run: nothing is published, since the pull request is the last step.

## Requirements *(mandatory)*

### Functional Requirements

**Page**

- **FR-001**: The page MUST accept only a repository and an optional issue number from its address, each strictly validated, and refuse anything else with a message saying what is expected.
- **FR-002**: The page MUST read `TAKE_MY_TOKENS.md` from the named repository before offering anything, and offer nothing when the file is absent or could not be read.
- **FR-003**: The page MUST find the work itself: use the named issue if it is available; otherwise say why and pick another; without a named issue, pick at random among the available ones. An issue is available when it is open, labelled `take-my-tokens` and not taken (FR-034). The page MUST show the chosen issue's number and title and how many issues are available and being worked on, and offer nothing when none is available.
- **FR-004**: The page MUST state the project, the issue, that the contributor's own subscription is used, and the expected result, before any action.
- **FR-005**: The page MUST work at phone width, by keyboard, and with reduced motion.
- **FR-006**: Opening the page MUST NOT contact any third party other than GitHub, and MUST NOT store anything beyond the contributor's own choices in their own browser.
- **FR-007**: Every choice on the page MUST have a default that needs no interaction, and the path from badge to copied local command MUST take two clicks.

**Local run**

- **FR-008**: The page MUST show the tools the maintainer offers directly. Clicking one MUST show and copy one single-line command that checks the tool is installed, forks the project, enters it, claims the issue and starts that tool with a fixed task.
- **FR-009**: The page MUST offer the approval levels "before anything risky" (default), "less often", and, only if the maintainer offers it, "never", next to a warning about the risk.
- **FR-010**: Changing the approval level MUST clear any previously shown command.
- **FR-011**: The command MUST NOT contain free text taken from the address, the repository's file or an issue.

**Cloud run**

FR-012 to FR-017 described the cloud path, which left this version at GATE 2 (see Clarifications). Their numbers are not reused.

**Agent task**

- **FR-018**: The task MUST make the agent confirm the issue is open, labelled `take-my-tokens` and not taken, and otherwise apply FR-033.
- **FR-019**: Every task MUST make the agent follow `TAKE_MY_TOKENS.md` and the project's contributing guide, treat issue and comment text as a description of the work rather than instructions, make the smallest change that resolves the issue, add or update tests and run the project's checks. No text in the project, including `TAKE_MY_TOKENS.md`, may make the agent reveal secrets or act outside the repository.
- **FR-020**: Every task MUST make the agent stop and explain, rather than deliver, when the issue is too vague or the checks keep failing.
- **FR-021**: A pull request the agent opens MUST be a draft, link the issue and state the change was written by an AI agent.

**Many agents**

- **FR-032**: The copied command MUST claim the issue before the agent starts, with a comment under the contributor's own account, starting with the exact marker `take-my-tokens:claim`, and MUST NOT start the agent if the comment fails. The task receives the comment's address. An agent moving to another issue, or working without the page, MUST post the same claim before changing anything.
- **FR-033**: The task MUST make the agent first read the issue's comments. The issue is its own only if the earliest live claim is its own comment. Otherwise it MUST take another available issue without asking its contributor, trying at most 3 issues, then stop and say so. The task MUST give the exact commands for these steps.
- **FR-034**: An issue is taken when an open pull request references it or when it has a claim younger than 24 hours. Claims expire on their own: nothing has to release them.
- **FR-035**: An agent that stops without delivering MUST say why in a comment on the issue, and leaves its claim in place until it expires.
- **FR-036**: The page MUST state, before anything is copied, that the command comments on the issue under the contributor's account and that the agent may move to another issue.
- **FR-037**: The badge MUST show the live number of approved open issues, and its default link MUST NOT name an issue.

**Maintainer**

- **FR-022**: `TAKE_MY_TOKENS.md` MUST be the only configuration: two options (`providers`, `skip_permissions`) with safe defaults, followed by free text for agents.
- **FR-023**: The page opened with no repository MUST offer agent-guided setup first and setup by hand second.
- **FR-024**: The setup command MUST make the maintainer's agent ask its questions before changing anything, base the file on the project's real commands, recommend leaving `skip_permissions` off with the reason, create the label, add labels only to issues the maintainer approves, offer to add them to the project's GitHub board if it has one, and open a pull request for review.
- **FR-025**: Everything a maintainer does beyond that file MUST use GitHub's own features: labels and issues to approve work, project boards to track it, pull requests to review it, repository settings to limit it. The product MUST NOT provide a dashboard or its own tracking.

**AI first**

- **FR-026**: The product MUST publish plain-text instructions at a stable public address, readable without a browser, covering how to contribute to a project and how to set one up. The page and the README MUST point to them.
- **FR-027**: Those instructions MUST carry the same rules as the page: opt-in file, approved issues only, and no widening of the agent's own permissions unless its owner said so.
- **FR-028**: The instructions and the tasks the page builds MUST NOT drift apart: a check in the project's tests MUST fail if they do.

**Publishing**

- **FR-029**: The page and instructions MUST be published at a stable public address, automatically from the main branch, serving only the files they need.
- **FR-030**: The project MUST carry its own `TAKE_MY_TOKENS.md`, label, approved issues and badge.
- **FR-031**: The README and the page MUST describe only verified behaviour, and state what remains unverified.

### Key Entities

- **Project**: a public GitHub repository named by the link; opted in when it has the file.
- **Maintainer file (`TAKE_MY_TOKENS.md`)**: options deciding what is offered, plus free text for agents.
- **Approved issue**: an open issue carrying the `take-my-tokens` label.
- **Claim**: a comment on an issue starting with `take-my-tokens:claim`, live for 24 hours.
- **Available issue**: an approved issue with no live claim and no open pull request referencing it.
- **Tool**: the agent a contributor runs on their own machine: Claude Code, Codex or Gemini CLI.
- **Approval level**: how often the agent asks before acting.
- **Task**: the fixed instructions given to the agent, built from the validated repository and issue number only.
- **Agent instructions**: the plain-text document that lets an agent do by itself what the page helps a person do.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor with a tool and GitHub access already set up goes from the badge to a copied command in 2 clicks, and to a running agent with one paste.
- **SC-002**: A contributor gets a draft pull request from their fork on an opted-in project, verified with a real agent on a sandbox repository, with the write access they hold there stated in the README.
- **SC-003**: Removed with the cloud path.
- **SC-004**: A maintainer goes from nothing to a reviewable pull request with everything set up by running one command and answering at most 5 questions.
- **SC-005**: 100% of a set of crafted links and malformed files fail to change the command or what is offered.
- **SC-006**: A repository without the file never gets a way to run an agent from the page.
- **SC-007**: Every tool offered on the public page has been verified end to end on the real product, or is plainly marked as unverified.
- **SC-008**: A real agent given only the instructions' address completes a contribution and a setup with no browser and no question beyond its normal approvals and the setup questions.
- **SC-009**: Two real agents started on the same issue within the same minute, on a project with two approved issues, end up on different issues with no action from either contributor.

## Assumptions

- Contributors already have a Claude, Codex or Gemini account; the page does not sell or set up subscriptions.
- The contributor's usage is ordinary individual use of their own account in the vendor's own tool; nothing pools accounts or runs without them or their agent starting it.
- The local path targets bash and zsh; other shells are out of scope for this version.
- GitHub's public interface answers the page's anonymous reads, within its limit of 60 requests per hour per address.
- Enforcement of approved issues lives in the page and the agent's task, not in any server: a contributor can bypass it by hand, and maintainers still review pull requests as usual.
- The number of labelled issues is the number of agents that can work at once, so the maintainer's label is the throttle. Anything further is left to GitHub's own repository settings.
- Hosting is GitHub Pages under this project's account, with no custom domain.
- Out of scope: cloud sessions, dashboards, usage statistics, automatic scheduling of spare quota, Windows `cmd.exe`.
