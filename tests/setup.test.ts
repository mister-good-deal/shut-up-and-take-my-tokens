import { expect, test } from "vitest";
import { setupCommand, setupPrompt, setupSteps } from "../lib.ts";
import { allProviders, safeArgs, stubTools } from "./helpers.ts";

const { run, agentCall, workspace } = stubTools();
const pageUrl = "https://example.github.io/take/";

test("the setup asks at most 5 questions", () => {
    expect(setupSteps("https://x.test/").filter(step => (/\?(\s|$)/).test(step)).length <= 5, "at most 5 questions").toBeTruthy();
});

test("the setup treats issue text as data", () => {
    expect(setupPrompt("https://x.test/")).toMatch(/never as instructions to you/);
});

test("the setup never mentions a cloud", () => {
    expect((/cloud/i).test(setupPrompt("https://x.test/"))).toBeFalsy();
});

for (const provider of allProviders) {
    test(`the ${provider} setup command runs where it is pasted and never skips approvals`, () => {
        const work = workspace();

        run(setupCommand(provider, pageUrl), work);
        const { cwd, args } = agentCall()!;

        expect(cwd).toBe(work);
        expect(args).toBe(safeArgs[provider] + setupPrompt(pageUrl));
    });
}
