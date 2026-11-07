# Shut up and take my tokens

[![CI](https://github.com/mister-good-deal/shut-up-and-take-my-tokens/actions/workflows/ci.yml/badge.svg)](https://github.com/mister-good-deal/shut-up-and-take-my-tokens/actions/workflows/ci.yml)

**Status: prototype, not published yet.** The cloud button does not work yet for contributors without write access to the project.

A badge for open source READMEs. Whoever clicks it spends their spare Claude, Codex or Gemini quota on your project: an agent works on an issue you approved and opens a draft pull request.

Each contributor runs the agent on their own account, in the vendor's own tool. Nothing here handles credentials, pools accounts or runs a server: it is one static page that builds a link and a command.

## Add it to your project

Open [the page](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/), pick your tool and run the command it copies at the root of your repository. Your own agent asks you a few questions, then opens a pull request with everything below.

Or do it by hand:

1. Add `TAKE_MY_TOKENS.md` at the root of your repository. The page offers nothing until this file exists, so nobody can point agents at a project that did not ask for them.

   ```markdown
   ---
   cloud: true
   providers: claude, codex, gemini
   skip_permissions: false
   ---
   How to install and test this project, what is out of scope, pull request conventions.
   ```

2. Label the issues agents may work on with `take-my-tokens`.

3. Add the badge to your README, with your repository in the link. Add `&issue=12` to point at one issue.

   ```markdown
   [![Shut up and take my tokens](https://img.shields.io/badge/shut_up_and-take_my_tokens-E5B53F)](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/?repo=owner/name)
   ```

## Options

They go in the front matter of `TAKE_MY_TOKENS.md`. Everything below it is free text for the agents.

| Key | Default | What it does |
| --- | --- | --- |
| `cloud` | `true` | Shows the cloud button. |
| `providers` | `claude, codex, gemini` | The local tools on offer. Leave it empty to hide the local button. |
| `skip_permissions` | `false` | Offers contributors the choice to run locally without approval prompts. See below. |

To change them, change the file. GitHub already handles who may do that, the history and the review. To limit how many pull requests come in, use GitHub's own repository settings.

## What the contributor gets

| Button | What happens | Needs |
| --- | --- | --- |
| **Start in the cloud** | Opens Claude Code on claude.ai with the task filled in. They press send and can close the tab. | A paid Claude plan with GitHub connected |
| **Run it locally** | They pick Claude Code, Codex or Gemini CLI, and the page copies a one-line command that forks the repository and starts the agent. | `gh` signed in and the chosen CLI, in bash or zsh |

The cloud button only covers Claude Code: Codex and Gemini document no link that fills in a cloud task.

## How often the agent asks

Before copying a local command, the contributor picks how often the agent asks for approval. Cloud sessions pick this on claude.ai instead.

| Choice | Claude Code | Codex | Gemini CLI | Offered |
| --- | --- | --- | --- | --- |
| Before anything risky (default) | no flag | no flag | no flag | Always |
| Less often | `--permission-mode auto` | `--approve-for-me` | `--approval-mode=auto_edit` | Always |
| Never | `--dangerously-skip-permissions` | `--dangerously-bypass-approvals-and-sandbox` | `--approval-mode=yolo` | Only with `skip_permissions: true` |

"Less often" keeps a safeguard: Claude Code and Codex route approvals through an automatic review, and Gemini CLI approves edits but still asks before commands. If Claude Code's auto mode is unavailable, the session starts with normal prompts.

For "Never", the maintainer only decides whether the choice exists. It is the contributor's machine at risk, and anyone can publish a repository with this option on, so it never applies unless the contributor selects it, next to a warning.

## Security

- The page's URL only accepts a repository and an issue number, both strictly validated. It never takes free text, so a crafted link cannot change the prompt, inject shell commands or turn on `skip_permissions`.
- `TAKE_MY_TOKENS.md` is read from the repository the link names, so the page treats it as untrusted: only known keys and exact values count, and nothing from it is copied into a command.
- The command is shown before anyone runs it, and pasting it runs nothing until Enter is pressed.
- The label check is an instruction to the agent, not an enforcement. Review these pull requests like any other.

## Develop

```bash
npm test                         # Tests
python3 -m http.server 8000      # Then open http://localhost:8000/?repo=owner/name&issue=12
```

Not affiliated with Anthropic, OpenAI or Google.
