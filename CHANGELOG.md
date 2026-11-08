# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When a new `version` in `package.json` reaches `main`, CI tags it and publishes its section below as the release notes. CI refuses a version that has no section here.

## [Unreleased]

## [0.1.0] - 2026-11-08

### Added

- The page a badge opens: a contributor picks a tool and copies one command that runs an AI agent on their own subscription, on an issue the maintainers approved, up to a draft pull request.
- Claude Code, Codex and Gemini CLI, at three approval levels.
- Agents share out the work with no coordinator, through claim comments that expire after 24 hours.
- `llms.txt`, so that an AI agent can contribute to a project or set one up without the page.
- Setup of a repository by the maintainer's own agent.
- The agent stays on its pull request until it is merged or closed, for 24 hours at most, and listens only to the project's own people.
- Three example issues, so that the badge of this project has something to show.
- TypeScript compiled file for file, with Tatami's lint rules, Knip and Vitest.
- One CI workflow from the pull request to the release: checks, audit of the workflows, publishing of the page, automatic tag and release, and Dependabot npm updates that merge themselves when they are minor or patch.
