# Data model: First real version

There is no database and nothing is stored. These are the values the page handles in memory, all in `lib.js`.

## Params (from the page address)

| Field | Rule |
|---|---|
| `repo` | `owner/name`, strict regex; absent means the page shows maintainer setup |
| `issue` | Positive integer, up to 10 digits; optional |

Any other parameter is ignored. An invalid value produces an error message and nothing else.

## Options (from `TAKE_MY_TOKENS.md`)

| Field | Default | Rule |
|---|---|---|
| `providers` | all | Known names only; an empty list is allowed |
| `skip_permissions` | `false` | Only the exact value `true` turns it on, and it only offers the choice |

Unknown keys are ignored. The text below the front matter is for agents and the page never reads it.

## Issue (from the GitHub API, untrusted)

`number`, `title`, `labels`, plus `pull_request` on entries the API lists that are really pull requests.

**Approved** when it is listed by the `take-my-tokens` query and has no `pull_request` field. Titles reach the DOM through
`textContent` only, and never reach a task or a command.

## Claim (from the GitHub API, untrusted)

A comment whose body starts with exactly `take-my-tokens:claim`. The page keeps only the issue number, read from `issue_url`
with a strict regex, and `created_at`. No comment text is ever shown or passed on.

**Live** for 24 hours from `created_at`. There is no release: age alone ends it.

**Owner**: the first live claim GitHub lists on the issue, never compared by author. Dates stop at the second, and the list's order is the same for every reader, so it settles a tie.

## Issue states

```text
approved -> available -> taken (live claim, or open pull request referencing it)
               ^                    |
               +--- claim expires, no open pull request ---+
```

## Work (what the page decides, `pickIssue`)

Input: named issue or none, listed issues, open pull requests, live claims, a random source (injected, for tests). Output: one
available issue with the counts of available and taken issues, or a reason for offering nothing.

| Situation | Result |
|---|---|
| Named and available | That issue |
| Named, not approved or taken, others available | One of the others, and the page says why |
| Not named, some available | A random available issue |
| None available, some taken | Nothing, and the page says they are all being worked on |
| None approved | Nothing, and the page says so |

## Page state (`pageState`)

Computed before anything renders, so that every branch stays testable under Node.

```text
no repo in the address         -> setup
invalid address                -> setup + error
file absent                    -> setup + "has not opted in"
file or API unreadable         -> error "could not check, try later", nothing offered
empty list of tools            -> "turned off", nothing offered
no approved issue              -> "nothing to take", nothing offered
all approved issues taken      -> "all being worked on", nothing offered
otherwise                      -> task(issue, counts, tools, levels)
```
