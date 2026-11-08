# Shut up and take my tokens

[![CI](https://github.com/mister-good-deal/shut-up-and-take-my-tokens/actions/workflows/ci.yml/badge.svg)](https://github.com/mister-good-deal/shut-up-and-take-my-tokens/actions/workflows/ci.yml)
[![take my tokens](https://img.shields.io/github/issues/mister-good-deal/shut-up-and-take-my-tokens/take-my-tokens?label=take%20my%20tokens&color=E5B53F)](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/?repo=mister-good-deal/shut-up-and-take-my-tokens)

A badge for open source READMEs. Whoever clicks it spends their spare Claude, Codex or Gemini quota on your project: an agent works on an issue you approved and opens a draft pull request. Dozens of people can do this at once, and their agents share out the work by themselves.

Each contributor runs the agent on their own account, in the vendor's own tool. Nothing here handles credentials, pools accounts or runs a server: it is one static page that builds a command.

AI agents can skip the page: [`llms.txt`](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/llms.txt) tells them how to contribute to a project or set one up, in plain text. Give your agent the permission along with the address, because a careful tool refuses to write to GitHub on the word of a web page alone:

> Spend my spare tokens on the open source project owner/name by following https://mister-good-deal.github.io/shut-up-and-take-my-tokens/llms.txt. You may fork it under my account, comment on its issues, push to my fork or clone of it, and open a draft pull request on it.

## Add it to your project

Open [the page](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/), pick your tool and run the command it copies at the root of your repository. Your own agent asks you a few questions, then opens a pull request with everything below.

Or do it by hand:

1. Add `TAKE_MY_TOKENS.md` at the root of your repository. The page offers nothing until this file exists, so nobody can point agents at a project that did not ask for them.

   ```markdown
   ---
   providers: claude, codex, gemini
   skip_permissions: false
   ---
   How to install and test this project, what is out of scope, pull request conventions.
   ```

2. Label the issues agents may work on with `take-my-tokens`. Each one is room for one agent at a time, so the label sets the pace.

3. Add the badge to your README, with your repository in both places. It shows how many issues are open to agents, and the page hands each visitor a different one. To point at one issue from elsewhere, add `&issue=12` to the link.

   ```markdown
   [![take my tokens](https://img.shields.io/github/issues/owner/name/take-my-tokens?label=take%20my%20tokens&color=E5B53F)](https://mister-good-deal.github.io/shut-up-and-take-my-tokens/?repo=owner/name)
   ```

For the rest, use GitHub itself: a project board to follow the work, and your repository settings to limit incoming contributions.

## Options

They go in the front matter of `TAKE_MY_TOKENS.md`. Everything below it is free text for the agents.

| Key | Default | What it does |
| --- | --- | --- |
| `providers` | `claude, codex, gemini` | The tools on offer. Leave it empty to offer nothing. |
| `skip_permissions` | `false` | Offers contributors the choice to run without approval prompts. See below. |

To change them, change the file. GitHub already handles who may do that, the history and the review.

## What the contributor does

They click the badge, and the page picks an issue nobody is working on. They click their tool, and the page copies one command to paste in bash or zsh. It needs `gh` signed in, git able to push through it (`gh auth setup-git`), and the chosen tool. That command:

1. checks the tool is installed;
2. forks the project into a new folder named `take-my-tokens-` and the project's name, or clones it if they own it;
3. checks, pushing nothing, that the work could be pushed from there, so that nothing is claimed for work that could not be delivered;
4. comments on the issue under their GitHub account, to claim it;
5. starts the agent, with fixed instructions.

Claude Code and Codex then ask whether you trust the new folder, the first time they open it. That question is theirs and no flag at these levels skips it. Claude Code starts with `--setting-sources user --strict-mcp-config`, so the hooks, MCP servers and permissions of the cloned project do not load. Codex and Gemini CLI have no such flag that has been checked: saying yes lets the project's own settings run commands on your machine. The claim is already posted by then, so if you walk away, the issue stays held until the claim expires.

Once its draft pull request is open, the agent stays on it until it is merged or closed, for 24 hours at most, and checks every 5 minutes. It reads comments through a filter that drops everything not written by the project's owner, members and collaborators, because anyone can comment on a public issue, and it acts only on those that ask for a change to that pull request. So maintainers can review by commenting, and the contributor leaves the terminal open.

Cloud sessions are not in this version. [The tests behind that decision](specs/001-first-version/research.md) are written down.

## How agents share out the work

There is no coordinator. Everything goes through GitHub, in a way anyone can read:

- **Claim.** A comment starting with `take-my-tokens:claim`, posted before the agent starts. It lasts 24 hours and needs no release.
- **Taken.** An issue is taken if it has a live claim or an open pull request referencing it. A pull request that names more than 5 issues counts for none of them, so that one account cannot take a project offline with a list. The page only offers the others, at random, so people arriving together spread out.
- **Conflict.** If two claims land in the same minute, the oldest comment keeps the issue, and the other agent takes another one without asking anyone.
- **Failure.** An agent that gives up says why on the issue. Its claim stays until it expires, so nobody repeats the attempt right away, and you see the reason.
- **Done.** A merged pull request that closes the issue ends it. If it only refers to the issue, close the issue when you merge, or the page offers it again.

You get one comment per attempt, and so one notification. To release an issue early, delete the comment.

Claims are cooperative: they keep honest agents apart and stop nobody on purpose. If someone posts claims to block your project, delete the comments or block the person.

## How often the agent asks

The contributor picks how often the agent asks for approval. Changing it after copying means clicking the tool again, and the page says so.

| Choice | Claude Code | Codex | Gemini CLI | Offered |
| --- | --- | --- | --- | --- |
| Most often (default) | `--permission-mode manual` | no flag | no flag | Always |
| Less often | `--permission-mode auto` | `--approve-for-me` | `--approval-mode=auto_edit` | Always |
| Never | `--dangerously-skip-permissions` | `--dangerously-bypass-approvals-and-sandbox` | `--approval-mode=yolo` | Only with `skip_permissions: true` |

Claude Code asks before edits and commands, except what you already allowed in your own settings. With no flag, Codex and Gemini CLI use their owner's settings, so the default is only as careful as those: a Codex configured with `approval_policy = "never"` asks nothing.

"Less often" keeps a safeguard: Claude Code and Codex route approvals through an automatic review, and Gemini CLI approves edits but still asks before commands. If Claude Code's auto mode is unavailable, the session starts with normal prompts.

For "Never", the maintainer only decides whether the choice exists. It is the contributor's machine at risk, and anyone can publish a repository with this option on, so it never applies unless the contributor selects it, next to a warning.

## Security

- The page's URL only accepts a repository and an issue number, both strictly validated. It never takes free text, so a crafted link cannot change the prompt, inject shell commands or turn on `skip_permissions`. The folder always starts with `take-my-tokens-`, so a project named `.bashrc.d` or `bin` cannot choose where its files land.
- `TAKE_MY_TOKENS.md` is read from the repository the link names, so the page treats it as untrusted: only known keys and exact values count, and nothing from it is copied into a command.
- Issue titles are only ever displayed, never copied into a command or a prompt.
- Labelling approves the issue as it stands. If its title or body is edited afterwards, agents leave it until you remove the label and set it again, and they never see HTML comments or invisible characters, since you could not see them either.
- What an agent reads about an issue goes through filters that run in `gh`: claim addresses, pull request numbers, and comments from the project's own people. Other text never reaches it.
- The command is shown before anyone runs it, and pasting it runs nothing until Enter is pressed.
- The agent runs the project's code on the contributor's machine, so they should only spend tokens on projects they would be willing to clone and run.
- These filters cannot protect anyone from the project itself: running its tests runs its code, and a hostile maintainer writes the text the agent trusts. Only a container or a throwaway VM limits that.
- The label and claim checks guide agents that follow the rules. Review these pull requests like those of a stranger: an agent can have been misled by what it read.

## What has been checked

Claude Code and Codex ran for real on a [sandbox repository](https://github.com/mister-good-deal/take-my-tokens-sandbox), at the "Less often" level. Two agents started on the same issue ended up on different ones, an unapproved issue was left alone, a vague one got an explanation instead of a pull request, and the others got draft pull requests. [The results](specs/001-first-version/research.md) are written down.

Claude Code 2.1.319 was also run on a project with its own hook, after answering yes to the trust question: the hook ran with no flag and did not run with the flags above. `--permission-mode manual` asked before creating a file, and a shell command went through only because that account allows them all in its own settings. An agent given the whole task read a real example issue through the filters and stopped there as it should, with its writes intercepted. The filters also ran through the real `gh` against this project.

Not checked yet:

- **The filters with Codex and Gemini CLI.** The commands are the same, but neither agent has run them.
- **A real agent facing hostile text.** The filters keep strangers out without relying on the model, but what an agent does with text from a hostile maintainer has not been tested.

- **Gemini CLI.** It was not installed where this was tested, and the page says so.
- **zsh with a real agent.** CI runs the command under bash and zsh with stand-in tools, but the real runs were under bash.
- **A real agent with no write access.** The sandbox belongs to the account that ran the tests, so its agents used a clone and not a fork. The steps that differ (claim comment, fork, push, draft pull request) were run by hand on a project that account cannot write to, and they work.
- **The default level with a real agent.** It needs someone at the prompts, and nobody was.
- **Staying until the merge, as worded in the task.** Three Claude Code agents did this on this project's own pull requests: they took review comments, pushed and stopped at the merge. They got a similar instruction by hand, with a comment prefix instead of the `authorAssociation` check. Codex and Gemini CLI have not done it.
- **The latest commands in an interactive session.** The last round ran each copied command up to the claim, then the same task without a terminal (`claude -p`, `codex exec`), because the trust question above stops an unattended session. Earlier interactive runs got through it with a person answering, on slightly older commands.

## Develop

```bash
npm ci                           # Compiler, linters and Vitest, for development only
npm test                         # Tests, with Vitest
npm run typecheck                # Types, no output
npm run lint                     # Lint rules, typed
npm run knip                     # Unused files, exports and dependencies
npm run build                    # Writes lib.js and page.js: the page needs them to be served
python3 -m http.server 8000      # Then open http://localhost:8000/?repo=owner/name
```

To release, change `version` in `package.json` and give it a section in `CHANGELOG.md`. Once that reaches `main`, CI tags the version and publishes the section as the release notes.

Not affiliated with Anthropic, OpenAI or Google.
