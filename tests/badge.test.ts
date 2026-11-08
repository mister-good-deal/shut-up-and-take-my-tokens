import { expect, test } from "vitest";
import { badge } from "../lib.ts";

test("the badge counts approved issues live and names no issue", () => {
    expect(badge("https://x.test/", "a/b")).toBe("[![take my tokens](https://img.shields.io/github/issues/a/b/take-my-tokens?label=take%20my%20tokens&color=E5B53F)](https://x.test/?repo=a/b)");
});
