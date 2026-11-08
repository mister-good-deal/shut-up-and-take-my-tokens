import { expect, test } from "vitest";
import { pickIssue } from "../lib.ts";
import { issue } from "./helpers.ts";

const pick = (over: object) => pickIssue({ repo: "a/b", named: null, issues: [issue(1), issue(2), issue(3)], pulls: [], claims: new Set(), random: () => 0, ...over });

test("offers an issue when nothing is taken", () => {
    expect(pick({}).issue!.number).toBe(1);
});

test("visitors spread over the available issues", () => {
    expect(pick({ random: () => 0.99 }).issue!.number, "visitors spread over the available issues").toBe(3);
});

test("counts the available and the taken issues", () => {
    expect(pick({ claims: new Set([1]) }).counts).toStrictEqual({ available: 2, taken: 1 });
});

test("a claimed issue is not offered", () => {
    expect(pick({ claims: new Set([1]) }).issue!.number, "a claimed issue is not offered").toBe(2);
});

test("an issue with an open pull request is not offered", () => {
    expect(pick({ pulls: [{ title: "Fix #1", body: "" }] }).issue!.number, "an issue with an open pull request is not offered").toBe(2);
});

test("a number of another repository takes nothing", () => {
    expect(pick({ pulls: [{ title: "Bump", body: "other/project#1" }] }).issue!.number, "a number of another repository takes nothing").toBe(1);
});

test("pull requests are not issues", () => {
    expect(pick({ issues: [issue(1, { pull_request: {}}), issue(2)] }).issue!.number, "pull requests are not issues").toBe(2);
});

test("pull requests are not counted", () => {
    expect(pick({ issues: [issue(1, { pull_request: {}}), issue(2)] }).counts).toStrictEqual({ available: 1, taken: 0 });
});

test("only integer numbers can reach a command", () => {
    expect(pick({ issues: [issue("1;id"), issue(-5), issue(1e21), issue(2)] }).issue!.number, "only integer numbers can reach a command").toBe(2);
});

test("nothing is offered when every issue is claimed", () => {
    expect(pick({ claims: new Set([1, 2, 3]) }).issue).toBe(null);
});

test("nothing is offered when there are no issues", () => {
    expect(pick({ issues: [] }).issue).toBe(null);
});

test("a free named issue is offered", () => {
    expect(pick({ named: "2" })).toStrictEqual({ issue: issue(2), counts: { available: 3, taken: 0 }, namedProblem: null });
});

test("a taken named issue gives way to another, and says so", () => {
    expect(pick({ named: "2", claims: new Set([2]) })).toStrictEqual({ issue: issue(1), counts: { available: 2, taken: 1 }, namedProblem: "taken" });
});

test("a named issue that is not approved gives way to another, and says so", () => {
    expect(pick({ named: "9" })).toStrictEqual({ issue: issue(1), counts: { available: 3, taken: 0 }, namedProblem: "not-approved" });
});

test("a taken named issue with no other available offers nothing", () => {
    expect(pick({ named: "2", issues: [issue(2)], claims: new Set([2]) }).issue).toBe(null);
});
