import { execFileSync } from "node:child_process";
import { expect, test } from "vitest";
import { shellQuote } from "../lib.ts";

// Harmless on purpose: if quoting ever breaks, this text really runs, on the machine of whoever runs the tests.
const evil = "it's $(echo sub) `echo tick` \"q\" \\ ; echo semi\nline2";

test("quoting survives a real shell", () => {
    expect(execFileSync("bash", ["-c", `printf %s ${shellQuote(evil)}`], { encoding: "utf8" })).toBe(evil);
});
