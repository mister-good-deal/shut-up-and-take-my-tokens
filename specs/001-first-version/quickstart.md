# Quickstart: validating the first version

## Automated

```bash
npm test
```

Covers: address validation, `TAKE_MY_TOKENS.md` parsing, `liveClaims` including the 24-hour boundary, `pickIssue`, `pageState`,
task building, a real bash round trip of the quoting, the local command against stub tools including the owner fallback, and
the claim and rules present in `llms.txt`.

## In a real browser

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/`, with fixtures or a repository that has opted in. Fixtures need a scratch copy of the site with
`connect-src` relaxed in its CSP; B10 runs on the untouched files. Check:

| # | Scenario | Expected |
|---|---|---|
| B1 | No `repo` | Setup page, agent setup first |
| B2 | Crafted links (shell syntax, extra parameters) | Refused or ignored, command unchanged |
| B3 | Repository without the file | Nothing offered, reason stated |
| B4 | One tool listed; empty list | Only what is allowed is shown; reason stated when empty |
| B5 | No approved issue; all approved issues taken | Nothing offered, reason stated, number being worked on shown |
| B6 | Approved issue, then click a tool | **2 clicks from the badge**; clipboard matches the visible command, on one line |
| B7 | Change the approval level | Shown command cleared; "Never" absent unless offered |
| B8 | Issue title containing HTML | Shown as text; nothing runs |
| B9 | Blocked clipboard | Command stays visible to copy by hand |
| B10 | Network panel on open | Only the page's own host, `raw.githubusercontent.com` and `api.github.com` |
| B11 | Phone width, keyboard only, reduced motion | Usable, no horizontal scroll, no animation |
| B12 | `curl` the page | Plain-text pointer to `llms.txt` present in the HTML |
| B13 | Issue with a live claim; with a claim older than 24 hours; with an open pull request and an old claim | Not offered; offered; not offered |
| B14 | Reload several times with several available issues | Different issues come up, counts shown, and the note says the command comments under their account |
| B15 | Named issue taken or not approved, others available | Page says why and offers another |

## On the real products

Skipped checks are reported as skipped, never as passed. P1 to P4 run on the sandbox repository in the maintainer's
organisation (research R10).

| # | Scenario | Expected |
|---|---|---|
| P1 | Claude Code, Ask level, real run | Claim comment posted by the command, then draft pull request from the fork, issue linked, AI agent stated |
| P2 | Same with Codex | Same |
| P3 | Started on an issue with no label, or one already taken, others available | Agent moves to another, with no question and nothing pushed for the first |
| P4 | Project owned by the person running it | Command reaches a clone, delivery still works |
| P5 | Setup command with a real agent in a sandbox | At most 5 questions, then a pull request whose file the page accepts |
| P6 | Real agent, no browser, given only the `llms.txt` address | Contribution and setup both complete, and it stops when there is no file |
| P7 | Public address after publishing | Same as local, from this project's own badge, with a live count on the badge |
| P8 | Two real agents, Claude Code and Codex, started on the same issue within the same minute, two issues approved | They end up on different issues, nothing asked of anyone about the claim, and the page then offers neither (SC-009) |
| P9 | An agent stops on a deliberately vague issue | It says why on the issue, and the page does not offer it while the claim is live |

**Not coverable here**: Gemini CLI is not installed, so it is marked unverified on the page. A contributor truly without write
access is not observed; the README says so.
