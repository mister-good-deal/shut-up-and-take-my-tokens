// The local command, end to end against stub tools, without touching GitHub, in every shell it targets.
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { CLAIM_COMMENT, buildPrompt, localCommand } from "../lib.ts";
import { CLAIM_URL, allProviders, missing, safeArgs, shells, stubTools } from "./helpers.ts";

const { dir, run, toolCalls, agentCall, workspace } = stubTools();

const autoArgs: Record<string, string> = {
    claude: "--permission-mode auto ",
    codex: "--approve-for-me ",
    gemini: "--approval-mode=auto_edit -i "
};
const skipArgs: Record<string, string> = {
    claude: "--dangerously-skip-permissions ",
    codex: "--dangerously-bypass-approvals-and-sandbox ",
    gemini: "--approval-mode=yolo -i "
};
const folder = "take-my-tokens-web.app";
const fork = `repo fork acme/web.app --clone -- ${folder}`;
const clone = `repo clone acme/web.app ${folder}`;
const push = "git push -q --dry-run origin HEAD:refs/heads/take-my-tokens-check";
const comment = `issue comment 7 --repo acme/web.app --body ${CLAIM_COMMENT}`;

for (const shell of shells) {
    describe.skipIf(missing(shell))(`the local command under ${shell}`, () => {
        for (const provider of allProviders) {
            for (const [mode, flags] of [["ask", safeArgs], ["auto", autoArgs], ["skip", skipArgs]] as const) {
                test(`${provider} in ${mode} mode claims the issue, then starts the agent with the address of its claim`, () => {
                    const work = workspace();
                    const command = localCommand(provider, "acme/web.app", 7, mode);

                    expect((/[\r\n]/).test(command), "the command must stay on one line").toBeFalsy();
                    expect(run(command, work, shell)).toBe(0);
                    expect(toolCalls(), "the claim goes out before the agent starts, and only if the work could be pushed").toStrictEqual([fork, push, comment]);
                    const { name, cwd, args } = agentCall()!;

                    expect(name).toBe(provider);
                    expect(cwd).toBe(join(work, folder));
                    expect(args, "the agent receives the address of its claim").toBe(flags[provider] + buildPrompt("acme/web.app", 7) + CLAIM_URL);
                });
            }
        }

        test("a contributor who owns the project cannot fork it, and still reaches a clone and a claim", () => {
            const work = workspace();

            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { FAIL_FORK: "1" })).toBe(0);
            expect(toolCalls()).toStrictEqual([fork, clone, push, comment]);
            expect(agentCall()!.cwd).toBe(join(work, folder));
        });

        test("anyone else whose fork failed gets a clone they cannot push to, and neither a claim nor an agent", () => {
            const work = workspace();

            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { FAIL_FORK: "1", FAIL_PUSH: "1" })).not.toBe(0);
            expect(toolCalls()).toStrictEqual([fork, clone, push]);
            expect(agentCall()).toBe(null);
        });

        test("the name of a repository cannot choose where its files land", () => {
            const work = workspace();

            expect(run(localCommand("claude", "evil/.bashrc.d", 7), work, shell)).toBe(0);
            expect(existsSync(join(work, ".bashrc.d"))).toBeFalsy();
            expect(agentCall()!.cwd).toBe(join(work, "take-my-tokens-.bashrc.d"));
        });

        test("a checkout of the same name elsewhere on CDPATH is left alone", () => {
            const work = workspace();
            const elsewhere = mkdtempSync(join(dir, "elsewhere-"));

            mkdirSync(join(elsewhere, folder));
            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { CDPATH: elsewhere })).toBe(0);
            expect(agentCall()!.cwd).toBe(join(work, folder));
        });

        test("a missing tool stops everything before anything is forked or posted", () => {
            const work = workspace();

            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { FAIL_TOOL: "1" })).not.toBe(0);
            expect(toolCalls()).toStrictEqual([]);
            expect(agentCall()).toBe(null);
        });

        test("without a clone, for instance because the folder exists, no comment goes out", () => {
            const work = workspace();

            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { FAIL_FORK: "1", FAIL_CLONE: "1" })).not.toBe(0);
            expect(toolCalls()).toStrictEqual([fork, clone]);
            expect(agentCall()).toBe(null);
        });

        test("without a claim, for instance on a locked issue, no agent starts", () => {
            const work = workspace();

            expect(run(localCommand("claude", "acme/web.app", 7), work, shell, { FAIL_COMMENT: "1" })).not.toBe(0);
            expect(agentCall()).toBe(null);
        });
    });
}

for (const provider of allProviders) {
    for (const mode of ["ask", "auto"] as const) {
        test(`${provider} in ${mode} mode keeps its safeguards`, () => {
            expect((/danger|yolo/).test(localCommand(provider, "a/b", 7, mode)), `${mode} must keep its safeguards`).toBeFalsy();
        });
    }

    test(`asking is the default for ${provider}`, () => {
        expect(localCommand(provider, "a/b", 7), "asking is the default").toBe(localCommand(provider, "a/b", 7, "ask"));
    });
}
