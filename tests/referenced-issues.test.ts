import { expect, test } from "vitest";
import { referencedIssues } from "../lib.ts";

test("finds issue numbers and issue addresses in titles and bodies", () => {
    expect([...referencedIssues([{ title: "Fix #3", body: null }, { title: "x", body: "See https://github.com/a/b/issues/4 and #5, not #x or 6" }], "a/b")]).toStrictEqual([3, 4, 5]);
});

test("finds every way of writing a reference to this repository", () => {
    expect([...referencedIssues([{ title: "(#1) gh-2 GH-3", body: "a/b#4 A/B#5 https://github.com/A/b/issues/6 [#7] done" }], "a/b")]).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
});

test("the numbers of other repositories take nothing", () => {
    expect([...referencedIssues([{ title: "Bump pflag", body: "spf13/pflag#452 https://github.com/github/codeql-action/issues/4286 <a href=\"https://x.test/4284\">#4284</a> [#77](https://github.com/x/y/issues/77) &#8203; x-a/b#6 pgh-8" }], "a/b")], "the numbers of other repositories take nothing").toStrictEqual([]);
});

test("a dot in a repository name is a dot", () => {
    expect([...referencedIssues([{ title: "a/bxc#9 https://github.com/a/bxc/issues/10", body: "" }], "a/b.c")], "a dot in a repository name is a dot").toStrictEqual([]);
});
