import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { CLAIM_COMMENT, RULES, claimSteps, deliverySteps, instructionsUrl, listCommand, prepareSteps, pullCheck, setupSteps } from "../lib.ts";

const llms = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
// llms.txt writes the issue number as the letter N.
const N = "N" as unknown as number;
const [fork, enter, dryRun] = prepareSteps("R", "FOLDER");

// The whole file, on purpose: every agent that reads it obeys it, so a line added there has to be added here too, in plain sight.
const expected = `# Shut up and take my tokens

People spend their spare AI subscription on open source projects: agents they run on their own accounts take issues the maintainers approved, and each ends with a draft pull request.
Dozens of agents may work on one project at once, with no coordinator. They share out the work through the rules below, so follow them exactly.

Do not widen your own permissions, or skip approvals, unless your owner told you to. Contributing forks the project, comments on an issue, pushes a branch and opens a draft pull request under your owner's account. If your tool refuses one of these because this page asked for it, stop and ask your owner: only they can allow it.

## Contribute to a project

Below, R is the project as owner/name, N is an issue number, and FOLDER is take-my-tokens- followed by the name of the project, so that its name cannot choose where its files land. Stop and say so if R does not look like owner/name or N is not a positive whole number.

Check that the project is open to you. Stop and say so if TAKE_MY_TOKENS.md is missing: its maintainers have not opened it to agents. Stop and say so too if its front matter has a providers line that is empty or does not name your tool, among claude, codex and gemini: its maintainers have turned agents off, or this tool.

    curl -fsS ${instructionsUrl("R")}

Find work before anything else, so that a project with nothing free costs no fork. The first command prints the approved issues with no claim younger than 24 hours, and the second the open pull requests that mention issue N. Choose at random one that no pull request mentions, and stop and say so if there is none.

    ${listCommand("R")}
    ${pullCheck("R", N)}

Get the project ready. The last command pushes nothing: it stops you here, before any claim, if you could not push your work later.

    ${fork}
    ${enter}
    ${dryRun}

Claim it before changing anything. The command prints your claim comment url.

    gh issue comment N --repo R --body "${CLAIM_COMMENT}"

Then follow these steps:

${[...claimSteps("R", N), ...deliverySteps("R")].join("\n")}

While you work:

${RULES.join("\n")}

## Set up a repository

Do this at the root of the repository, for its maintainer. These are the instructions as the maintainer would give them to you:

${setupSteps("https://mister-good-deal.github.io/shut-up-and-take-my-tokens/").join("\n")}
`;

test("llms.txt is exactly what the page tells agents, and nothing else", () => {
    expect(llms).toBe(expected);
});
