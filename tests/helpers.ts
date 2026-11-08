// What several test files share: the fake GitHub, the stub tools, and the values they are built from.
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";
import { type ProviderName, CLAIM_COMMENT, PROVIDERS, commentsUrl, instructionsUrl, issuesUrl, pullsUrl, shellQuote } from "../lib.ts";

export const allProviders = Object.keys(PROVIDERS) as ProviderName[];
export const craftedRepos = ["a/b;rm -rf ~", "a/b c", "$(id)/b", "a/`id`", "a/b&&id", "a/b|id", "a/b'", "a/..", "a/.", "-a/b", "a/-b", "a/b\n", "a/b/c", "a", ""];
export const search = (repo: string, issue?: string) => new URLSearchParams({ repo, ...issue === undefined ? {} : { issue }}).toString();
export const front = (body: string) => `---\n${body}\n---\n# Instructions\n`;

export const now = Date.parse("2026-11-07T12:00:00Z");

const HOUR = 3600 * 1000;

export const claim = (issue: number, ageHours: number, body: string | null = CLAIM_COMMENT) => ({
    body,
    issue_url: `https://api.github.com/repos/a/b/issues/${issue}`,
    created_at: new Date(now - ageHours * HOUR).toISOString()
});
export const issue = <N extends number | string>(number: N, extra: object = {}) => ({ number, title: `Issue ${number}`, ...extra });

export const FILE = instructionsUrl("a/b");

type GitHub = { file?: string; fileStatus?: number; issues?: unknown; pulls?: unknown; comments?: unknown; apiStatus?: number };
export function fakeGitHub({ file = front("providers: claude"), fileStatus = 200, issues = [issue(1)], pulls = [], comments = [], apiStatus = 200 }: GitHub = {}) {
    const calls: string[] = [];
    const respond = (status: number, body: unknown) => Promise.resolve({
        status,
        ok: status < 400,
        text: () => Promise.resolve(body as string),
        json: () => Promise.resolve(body)
    });
    const fetchFn = (url: string) => {
        calls.push(url);
        if (url === FILE) return respond(fileStatus, file);
        if (url === issuesUrl("a/b")) return respond(apiStatus, issues);
        if (url === pullsUrl("a/b")) return respond(apiStatus, pulls);
        if (url === commentsUrl("a/b", now)) return respond(apiStatus, comments);

        return Promise.reject(new Error(`unexpected request: ${url}`));
    };

    return { fetchFn, calls };
}

export const shells = ["bash", "zsh"];
// The reason to skip a shell, shown in the results. CI installs both, so there nothing is skipped.
export const missing = (shell: string) => spawnSync(shell, ["--version"]).status !== 0 && `${shell} is not installed`;

export const safeArgs: Record<string, string> = { claude: "", codex: "", gemini: "-i " };
export const CLAIM_URL = "https://github.com/acme/web.app/issues/7#issuecomment-99";

// Stand-ins for gh, git and the agents, in a temporary folder removed when the test file ends. Nothing touches GitHub.
export function stubTools() {
    // realpath because the shell reports the real path, and a temporary folder can sit behind a symlink, as it does on macOS.
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "take-my-tokens-")));

    afterAll(() => rmSync(dir, { recursive: true, force: true }));
    const stub = (name: string, body: string) => {
        writeFileSync(join(dir, name), `#!/bin/bash\n${body}\n`);
        chmodSync(join(dir, name), 0o755);
    };

    stub("gh", `printf "%s\\n" "$*" >> "$OUT_DIR/calls.log"
case "$1 $2" in
  "repo fork") [ -z "$FAIL_FORK" ] && mkdir "$6" ;;
  "repo clone") [ -z "$FAIL_CLONE" ] && mkdir "$4" ;;
  "issue comment") [ -z "$FAIL_COMMENT" ] && echo "${CLAIM_URL}" ;;
  "pr list") printf "%s" "$PULLS" ;;
esac`);
    stub("git", `printf "%s\\n" "git $*" >> "$OUT_DIR/calls.log"
[ -z "$FAIL_PUSH" ]`);

    for (const name of allProviders) {
        stub(name, `if [ "$1" = "--version" ]; then [ -z "$FAIL_TOOL" ]; exit; fi
printf "%s" "${name}|$PWD|$*" > "$OUT_DIR/agent.args"`);
    }

    const reset = () => {
        for (const file of ["calls.log", "agent.args"]) rmSync(join(dir, file), { force: true });
    };
    // PATH is set inside the command: startup files (BASH_ENV, ~/.zshenv) run before it and could put the real gh and agents back ahead of the stubs.
    const run = (command: string, cwd: string, shell = "bash", env: Record<string, string> = {}) => {
        reset();

        return spawnSync(shell, ["-c", `PATH=${shellQuote(dir)}:"$PATH"; ${command}`], {
            cwd,
            env: { ...process.env, OUT_DIR: dir, ...env }
        }).status;
    };
    const toolCalls = () => (existsSync(join(dir, "calls.log")) ? readFileSync(join(dir, "calls.log"), "utf8").trim().split("\n") : []);
    const agentCall = () => {
        if (!existsSync(join(dir, "agent.args"))) return null;

        const [name, cwd, ...rest] = readFileSync(join(dir, "agent.args"), "utf8").split("|");

        return { name, cwd, args: rest.join("|") };
    };
    const workspace = () => mkdtempSync(join(dir, "work-"));

    return { dir, run, toolCalls, agentCall, workspace };
}
