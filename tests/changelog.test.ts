import { expect, test } from "vitest";
import { releaseNotes } from "../scripts/changelog.ts";

const changelog = `# Changelog

## [Unreleased]

## [1.2.0] - 2026-01-02

### Added

- New thing

## [1.1.0] - 2026-01-01

### Fixed

- Old thing
`;

test("the notes of a version stop at the next version", () => {
    expect(releaseNotes(changelog, "1.2.0")).toBe("### Added\n\n- New thing");
});

test("the notes of the oldest version reach the end of the file", () => {
    expect(releaseNotes(changelog, "1.1.0")).toBe("### Fixed\n\n- Old thing");
});

test("a version with no section is refused, even if another one starts the same", () => {
    expect(() => releaseNotes(changelog, "1.2")).toThrow("no section for 1.2");
});

test("a section with no entry is refused", () => {
    expect(() => releaseNotes(changelog, "Unreleased")).toThrow("no entry");
    expect(() => releaseNotes("## [2.0.0]\n\n### Added\n", "2.0.0")).toThrow("no entry");
});
