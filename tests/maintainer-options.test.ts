import { expect, test } from "vitest";
import { parseOptions } from "../lib.ts";
import { allProviders, front } from "./helpers.ts";

const defaults = { providers: allProviders, skip_permissions: false };

test("a file with no front matter gets the safe defaults", () => {
    expect(parseOptions("# No front matter\n")).toStrictEqual(defaults);
});

test("an empty file gets the safe defaults", () => {
    expect(parseOptions("")).toStrictEqual(defaults);
});

test("front matter only counts at the top", () => {
    expect(parseOptions("# Title\n---\nskip_permissions: true\n---\n"), "front matter only counts at the top").toStrictEqual(defaults);
});

test("front matter after a byte order mark or a blank line still counts", () => {
    expect(parseOptions(`\uFEFF${front("providers:")}`).providers).toStrictEqual([]);
    expect(parseOptions(`\n${front("providers:")}`).providers).toStrictEqual([]);
});

test("front matter sets the providers and skip_permissions", () => {
    expect(parseOptions(front("providers: claude, gemini\nskip_permissions: true"))).toStrictEqual({ providers: ["claude", "gemini"], skip_permissions: true });
});

test("unknown keys are ignored", () => {
    expect(parseOptions(front("cloud: false")), "unknown keys are ignored").toStrictEqual(defaults);
});

test("front matter with Windows line endings counts", () => {
    expect(parseOptions("---\r\nskip_permissions: true\r\n---\r\n").skip_permissions).toStrictEqual(true);
});

test("providers can be written as a list in brackets", () => {
    expect(parseOptions(front("providers: [codex]")).providers).toStrictEqual(["codex"]);
});

test("an empty providers line turns every provider off", () => {
    expect(parseOptions(front("providers:")).providers).toStrictEqual([]);
});

test("only known providers are kept", () => {
    expect(parseOptions(front("providers: claude, evil; rm -rf ~, __proto__, constructor")).providers).toStrictEqual(["claude"]);
});

for (const value of ["TRUE", "yes", "1", "true # sure", "\"true\"", ""]) {
    test(`skip_permissions stays off for ${JSON.stringify(value)}`, () => {
        expect(parseOptions(front(`skip_permissions: ${value}`)).skip_permissions, `should stay off: ${value}`).toBe(false);
    });
}

test("spaces around a value do not count", () => {
    expect(parseOptions(front("skip_permissions:  true  ")).skip_permissions, "spaces around a value do not count").toBe(true);
});

test("a crafted file cannot freeze the tab of a visitor", () => {
    const start = performance.now();

    parseOptions(front(`x:${" ".repeat(4000)}y\rz`));
    parseOptions(front(`x:y${" ".repeat(200000)}z`));
    expect(performance.now() - start < 1000, "crafted lines must parse fast").toBeTruthy();
});
