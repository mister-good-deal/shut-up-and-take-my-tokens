import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("the page sets a Content-Security-Policy", () => {
    expect(html).toMatch(/http-equiv="Content-Security-Policy"/);
});

test("scripts come from the page alone", () => {
    expect(html).toMatch(/script-src 'self';/);
});

test("the page has no inline script", () => {
    expect((/<script(?![^>]*\ssrc=)/).test(html), "no inline script").toBeFalsy();
});

test("the page loads no remote resource", () => {
    expect((/(?:src|href)="https?:|url\(https?:/).test(html), "no remote resource").toBeFalsy();
});

test("every font the page names is in the repository", () => {
    for (const font of html.matchAll(/url\((fonts\/[^)]+)\)/g)) expect(existsSync(new URL(`../${font[1]}`, import.meta.url)), `missing ${font[1]}`).toBeTruthy();
});
