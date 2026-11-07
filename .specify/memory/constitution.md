# Shut up and take my tokens Constitution

## Core Principles

### I. No Backend

The product MUST stay static files: no server, no database, no accounts of its own. It MUST NOT
collect, store, pool or intermediate anyone's credentials or session tokens. Every contributor MUST
run the agent on their own account, in the vendor's own tool.

Rationale: vendors forbid routing requests through plan credentials on behalf of others, and having
nothing to run is what keeps this free and trustworthy.

### II. Maintainer Opt-In

The page MUST NOT offer any way to run an agent on a repository without a `TAKE_MY_TOKENS.md` at its
root. All maintainer configuration MUST live in that one file, in a form an AI agent can write and
maintain. Agents MUST only take issues the maintainer marked with the `take-my-tokens` label.

Rationale: open source maintainers are drowning in unsolicited AI pull requests. This tool must never
add to that.

### III. Contributor Consent

Anything riskier than the agent's normal approval prompts MUST be an explicit choice by the
contributor, next to a warning. A link or a maintainer's file MAY offer that choice but MUST NOT make
it. Commands MUST be shown before they run, fit on one line and do nothing until Enter is pressed.

Rationale: the risk lands on the contributor's machine, and anyone can publish a repository.

### IV. Untrusted Inputs

URL parameters, `TAKE_MY_TOKENS.md` and issue text MUST be treated as attacker-controlled. URL
parameters and file options MUST be validated strictly against known values, and free text from them
MUST NOT be copied into a shell command or a prompt built by the page.

Rationale: the page's output gets pasted into terminals, from links anyone can craft.

### V. Verified On The Real Product

A vendor link, flag or capability MUST NOT be presented as working until it has been checked on the
real product, signed in as a contributor without write access to the target repository. Vendor
documentation is a starting point, not proof. What remains unverified MUST be stated.

Rationale: the first cloud link followed the docs exactly and did not work for a real contributor.

### VI. Least Code

Standard library and native platform features come first: no build step, no framework, no runtime
dependency. Every non-trivial branch of logic MUST keep a runnable check in `npm test`.

Rationale: maintainers and contributors must be able to read everything this page does in minutes.

## Technical Constraints

The page is HTML, CSS and JavaScript modules served as is by GitHub Pages. Logic that touches URLs or
commands MUST live in `lib.js`, away from the DOM, so that it stays testable under Node. Commands
target bash and zsh.

## Development Workflow

Work follows `/dev-workflow` with the project file `.specify/workflow-project.md`, which lists the
gates. Changes reach `main` through pull requests with green CI. Commits, issues and code are in
English.

## Governance

This constitution takes precedence over other project practices. The maintainer amends it by pull
request, stating the reason. Versions follow semantic versioning: MAJOR for a principle removed or
redefined, MINOR for a principle added or materially expanded, PATCH for wording. Every plan MUST
pass its Constitution Check, and any deviation MUST be accepted by the maintainer at GATE 2.

**Version**: 1.0.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-07
