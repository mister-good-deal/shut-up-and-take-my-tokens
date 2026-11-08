import { expect, test } from "vitest";
import { parseParams } from "../lib.ts";
import { craftedRepos, search } from "./helpers.ts";

const errorOf = (query: string) => {
    const params = parseParams(query);

    return "error" in params ? params.error : undefined;
};

test("a repository with dots and underscores is valid", () => {
    expect(parseParams(search("acme/web.app_2"))).toStrictEqual({ repo: "acme/web.app_2", issue: null });
});

test("a link can name an issue", () => {
    expect(parseParams(search("acme/.github", "12"))).toStrictEqual({ repo: "acme/.github", issue: "12" });
});

test("a link with no parameters is empty", () => {
    const params = parseParams("");

    expect("empty" in params && params.empty).toBeTruthy();
});

// Anything that could smuggle shell syntax is refused
for (const repo of craftedRepos) {
    test(`refuses the repository ${JSON.stringify(repo)}`, () => {
        expect(errorOf(search(repo)), `repo should be refused: ${JSON.stringify(repo)}`).toBeTruthy();
    });
}

for (const issue of ["1;id", "0", "-1", "1 2", "$(id)", "1\n", ""]) {
    test(`refuses the issue ${JSON.stringify(issue)}`, () => {
        expect(errorOf(search("a/b", issue)), `issue should be refused: ${JSON.stringify(issue)}`).toBeTruthy();
    });
}

test("a link can never turn the dangerous option on", () => {
    expect(parseParams("repo=a/b&skip_permissions=true&providers=evil")).toStrictEqual({ repo: "a/b", issue: null });
});
