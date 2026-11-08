import { expect, test } from "vitest";
import { type PageState, pageState } from "../lib.ts";
import { FILE, claim, craftedRepos, fakeGitHub, front, issue, now, search } from "./helpers.ts";

const state = (query: string, github: { fetchFn: Parameters<typeof pageState>[1] } = fakeGitHub()) => pageState(query, github.fetchFn, now, () => 0);
const reasonOf = (page: PageState) => ("reason" in page ? page.reason : undefined);

test("a link with no parameters shows the setup", async() => {
    expect(await state("")).toStrictEqual({ view: "setup" });
});

test("an invalid link reaches nothing", async() => {
    const github = fakeGitHub();
    const page = await state("repo=a/b;id", github);

    expect("error" in page && page.error).toBeTruthy();
    expect(github.calls.length, "an invalid link reaches nothing").toBe(0);
});

test("a project without the file spends no API call", async() => {
    const github = fakeGitHub({ fileStatus: 404 });

    expect(await state("repo=a/b", github)).toStrictEqual({ view: "setup", repo: "a/b", reason: "no-file" });
    expect(github.calls, "a project without the file spends no API call").toStrictEqual([FILE]);
});

test("a project that turned everything off spends no API call", async() => {
    const github = fakeGitHub({ file: front("providers:") });

    expect(await state("repo=a/b", github)).toStrictEqual({ view: "refused", repo: "a/b", reason: "off" });
    expect(github.calls, "a project that turned everything off spends no API call").toStrictEqual([FILE]);
});

test("a file that cannot be read offers nothing", async() => {
    expect(reasonOf(await state("repo=a/b", fakeGitHub({ fileStatus: 500 })))).toBe("unreadable");
});

test("the limit on anonymous requests offers nothing", async() => {
    expect(reasonOf(await state("repo=a/b", fakeGitHub({ apiStatus: 403 }))), "the limit on anonymous requests offers nothing").toBe("unreadable");
});

test("an answer that is not a list offers nothing", async() => {
    expect(reasonOf(await state("repo=a/b", fakeGitHub({ issues: { message: "nope" }})))).toBe("unreadable");
});

test("a network failure offers nothing", async() => {
    expect(reasonOf(await state("repo=a/b", { fetchFn: () => Promise.reject(new TypeError("offline")) }))).toBe("unreadable");
});

test("a project with no approved issue is refused", async() => {
    expect(await state("repo=a/b", fakeGitHub({ issues: [] }))).toStrictEqual({ view: "refused", repo: "a/b", reason: "none-approved", counts: { available: 0, taken: 0 }});
});

test("a project with every issue claimed is refused", async() => {
    expect(await state("repo=a/b", fakeGitHub({ comments: [claim(1, 2)] }))).toStrictEqual({ view: "refused", repo: "a/b", reason: "all-taken", counts: { available: 0, taken: 1 }});
});

test("an expired claim frees the issue", async() => {
    expect((await state("repo=a/b", fakeGitHub({ comments: [claim(1, 30)] }))).view, "an expired claim frees the issue").toBe("task");
});

test("an open pull request outlives its claim", async() => {
    expect(reasonOf(await state("repo=a/b", fakeGitHub({ comments: [claim(1, 30)], pulls: [{ title: "#1", body: "" }] }))), "an open pull request outlives its claim").toBe("all-taken");
});

test("a claimed named issue gives way to a free one, with the options of the project", async() => {
    const task = await state("repo=a/b&issue=1", fakeGitHub({ issues: [issue(1), issue(2)], comments: [claim(1, 1)] }));

    if (task.view !== "task") throw new Error(`expected a task, got ${task.view}`);

    expect(task.issue.number).toBe(2);
    expect(task.namedProblem).toBe("taken");
    expect(task.options).toStrictEqual({ providers: ["claude"], skip_permissions: false });
});

// Crafted links change neither what is offered nor the command
for (const extra of ["&skip_permissions=true", "&providers=evil", "&prompt=rm%20-rf", "&mode=skip", "&cloud=true", "&command=id"]) {
    test(`the extra parameter ${extra} changes nothing`, async() => {
        const plain = await state("repo=a/b");

        expect(await state(`repo=a/b${extra}`), `should change nothing: ${extra}`).toStrictEqual(plain);
    });
}

for (const repo of craftedRepos) {
    test(`the crafted repository ${JSON.stringify(repo)} is offered nothing`, async() => {
        expect((await state(search(repo))).view, `should offer nothing: ${JSON.stringify(repo)}`).toBe("setup");
    });
}
