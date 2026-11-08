---
providers: claude, codex, gemini
skip_permissions: false
---
# Working on this project

One static page: `index.html`, the `page` module for the DOM, and the `lib` module for every decision and everything that touches a URL or a command. The page ships no framework and no runtime dependency, and a change must not add one. TypeScript compiled file for file is the only build step, and development tools are allowed when CI runs them.

## Before you open a pull request

- Run `npm ci`, then `npm test`, `npm run typecheck`, `npm run lint` and `npm run knip`. Every non-trivial branch of logic needs a test.
- If you changed the page, serve it as the README's Develop section says and check the affected states in a real browser, at phone width too.
- If you changed a task or a rule in the `lib` module, change `llms.txt` to match: `npm test` fails otherwise.

## Several agents at once

The open issues here are worked on at the same time, one agent each, and each issue lists the files it owns.

- Change only the files your issue owns. If you notice something else, say it in one sentence in your pull request.
- Before you open your pull request, rebase on the project's latest `main` and make everything pass again, including checks that arrived since you started. Whoever lands second fixes what the first one changed, such as an import path.
- If `package.json` or `package-lock.json` conflict, keep both sides and run `npm install`.

## Example issues

#19, #20 and #21 are examples, so that the badge of this project always has something to show. They stay open and there is nothing to do on them. If you get one, change nothing, open no pull request, post no other comment and stop.

## Out of scope

Servers, accounts, dashboards, and anything that handles someone's credentials. Read `.specify/memory/constitution.md` before anything larger than a small fix: it holds the rules this project will not bend, such as never copying free text into a command.

## Pull requests

Written in English, one change per pull request, referring to the issue with `Refs #N`. Only the maintainer closes issues. Leave `CHANGELOG.md` and the version in `package.json` alone: the maintainer changes them for a release.
