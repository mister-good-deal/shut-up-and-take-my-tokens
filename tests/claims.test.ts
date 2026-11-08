import { expect, test } from "vitest";
import { CLAIM_COMMENT, MARKER, commentsUrl, liveClaims } from "../lib.ts";
import { claim, now } from "./helpers.ts";

test("the claim comment starts with the marker", () => {
    expect(CLAIM_COMMENT.startsWith(MARKER)).toBeTruthy();
});

test("a claim ends at 24 hours", () => {
    expect([...liveClaims([claim(1, 1), claim(2, 23.9), claim(3, 24), claim(4, 30)], now)], "a claim ends at 24 hours").toStrictEqual([1, 2]);
});

test("the marker must start the body", () => {
    expect([...liveClaims([claim(1, 1, `Quoting: ${MARKER}`), claim(2, 1, null), claim(3, 1, "nothing"), claim(4, 1, `${MARKER}NOPE`)], now)], "the marker must start the body").toStrictEqual([]);
});

test("malformed comments count for nothing", () => {
    expect([...liveClaims([{ ...claim(1, 1), issue_url: "https://evil.test/issues/1;id" }, { ...claim(2, 1), created_at: "soon" }], now)], "malformed comments count for nothing").toStrictEqual([]);
});

test("comments are read from 24 hours back", () => {
    expect(commentsUrl("a/b", now)).toMatch(/since=2026-11-06T12:00:00\.000Z/);
});
