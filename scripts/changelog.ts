// A release publishes the section of its version in CHANGELOG.md, so a version cannot go out without notes.
import { readFileSync } from "node:fs";

export function releaseNotes(changelog: string, version: string): string {
    const lines = changelog.split("\n");
    const start = lines.findIndex(line => line.startsWith(`## [${version}]`));

    if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version}`);

    const rest = lines.slice(start + 1);
    const end = rest.findIndex(line => line.startsWith("## "));
    const notes = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();

    if (!(/^- /mu).test(notes)) throw new Error(`The section for ${version} in CHANGELOG.md has no entry`);

    return notes;
}

if (import.meta.main) {
    const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

    console.log(releaseNotes(readFileSync("CHANGELOG.md", "utf8"), version));
}
