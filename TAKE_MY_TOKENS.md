---
providers: claude, codex, gemini
skip_permissions: false
---
# Working on this project

One static page: `index.html`, `page.js` for the DOM, and `lib.js` for every decision and everything that touches a URL or a command. There is no build step and no dependency, and a change must not add one.

## Before you open a pull request

- Run `npm test`. Every non-trivial branch of logic needs a check in `lib.test.mjs`.
- If you changed `index.html` or `page.js`, serve the folder with `python3 -m http.server` and check the affected states in a real browser, at phone width too.
- If you changed a task or a rule in `lib.js`, change `llms.txt` to match: `npm test` fails otherwise.

## Out of scope

Servers, accounts, dashboards, and anything that handles someone's credentials. Read `.specify/memory/constitution.md` before anything larger than a small fix: it holds the rules this project will not bend, such as never copying free text into a command.

## Pull requests

Written in English, one change per pull request, referring to the issue with `Refs #N`. Only the maintainer closes issues.
