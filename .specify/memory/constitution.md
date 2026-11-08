# Shut up and take my tokens Constitution

## Core Principles

### I. Fewest Interactions

Ease of use comes first, for contributors and maintainers alike. Every flow MUST minimize clicks and
interactions: when two designs both work, the one with fewer interactions MUST be chosen. An added
interaction MUST have a stated reason, and only two are accepted: a vendor requires it, or Maintainer
Opt-In or Contributor Consent does.

Rationale: the whole point is that spending spare quota on open source takes no effort. Every extra
step loses people.

### II. AI First

The product assumes it is used with the help of an AI agent, or entirely driven by one. Everything a
person can do here, an agent MUST be able to do from plain text and the command line: installing,
configuring, finding work and contributing. Instructions and configuration MUST be readable by an
agent without running a browser. An agent acting for someone MUST NOT grant itself more than that
person allowed.

The product is a general orchestration: dozens of agents, run by different people, working on the same
projects at the same time, with no coordinator of its own. Agents MUST NOT knowingly work on the same
issue: work is claimed through GitHub itself before any code is written, a conflict MUST resolve
without the contributor doing anything, and a claim that goes nowhere MUST expire on its own. Every
design MUST be judged with many simultaneous contributors in mind, not one.

Safe, deterministic commands and tested code come first. What has to adapt at run time MAY be a
workflow given to the agent in its task, written so that agents follow it with near certainty: ordered
steps, exact commands, explicit stops.

Rationale: contributors and maintainers here already work through agents, and the fewest interactions
for a person is often none at all. A duplicated run wastes both the quota people give and the review
time of the maintainer, so without this the product gets worse as it succeeds.

### III. Easy Install, GitHub Native

A maintainer MUST be able to install this by adding files and labels to their repository, with nothing
to host, register or sign up for. The product MUST rely on GitHub's native features (issues, labels,
projects and their kanban boards, pull requests, repository settings) and MUST NOT rebuild them.

Rationale: maintainers already work in GitHub. A tool that fits there needs no learning and no
maintenance of its own.

### IV. No Backend

The product MUST stay static files: no server, no database, no accounts of its own. It MUST NOT
collect, store, pool or intermediate anyone's credentials or session tokens. Every contributor MUST
run the agent on their own account, in the vendor's own tool.

Rationale: vendors forbid routing requests through plan credentials on behalf of others, and having
nothing to run is what keeps this free and trustworthy.

### V. Maintainer Opt-In

The page MUST NOT offer any way to run an agent on a repository without a `TAKE_MY_TOKENS.md` at its
root. All maintainer configuration MUST live in that one file, in a form an AI agent can write and
maintain. Agents MUST only take issues the maintainer marked with the `take-my-tokens` label.

Rationale: open source maintainers are drowning in unsolicited AI pull requests. This tool must never
add to that.

### VI. Contributor Consent

Anything riskier than the agent's normal approval prompts MUST be an explicit choice by the
contributor, next to a warning. A link or a maintainer's file MAY offer that choice but MUST NOT make
it. Commands MUST be shown before they run, fit on one line and do nothing until Enter is pressed.

Rationale: the risk lands on the contributor's machine, and anyone can publish a repository.

### VII. Untrusted Inputs

URL parameters, `TAKE_MY_TOKENS.md` and issue text MUST be treated as attacker-controlled. URL
parameters and file options MUST be validated strictly against known values, and free text from them
MUST NOT be copied into a shell command or a prompt built by the page.

Rationale: the page's output gets pasted into terminals, from links anyone can craft.

### VIII. Verified On The Real Product

A vendor link, flag or capability MUST NOT be presented as working until it has been checked on the
real product, signed in as a contributor without write access to the target repository. Vendor
documentation is a starting point, not proof. What remains unverified MUST be stated.

Rationale: the first cloud link followed the docs exactly and did not work for a real contributor.

### IX. Least Code

Standard library and native platform features come first: no framework and no runtime dependency.
TypeScript compiled file for file is the only build step, with no bundler and no minifier, so that
what is published stays readable. Development tools are allowed when CI runs them and the published
page does not contain them. Every non-trivial branch of logic MUST keep a runnable check in `npm test`.

Rationale: maintainers and contributors must be able to read everything this page does in minutes.

## Technical Constraints

The page is HTML, CSS and ES modules served by GitHub Pages. Logic that touches URLs or commands MUST
live in the `lib` module, away from the DOM, so that it stays testable under Node. Commands target
bash and zsh.

## Development Workflow

Work follows `/dev-workflow` with the project file `.specify/workflow-project.md`, which lists the
gates. Changes reach `main` through pull requests with green CI. Commits, issues and code are in
English.

## Governance

This constitution takes precedence over other project practices. The maintainer amends it by pull
request, stating the reason. Versions follow semantic versioning: MAJOR for a principle removed or
redefined, MINOR for a principle added or materially expanded, PATCH for wording. Every plan MUST
pass its Constitution Check, and any deviation MUST be accepted by the maintainer at GATE 2.

**Version**: 2.0.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-08
