// Run with: node lib.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { PROVIDERS, buildPrompt, cloudUrl, localCommand, parseOptions, parseParams, setupCommand, setupPrompt, shellQuote } from './lib.js';

const search = (repo, issue) => new URLSearchParams({ repo, ...(issue === undefined ? {} : { issue }) }).toString();

// Valid input
assert.deepEqual(parseParams(search('acme/web.app_2')), { repo: 'acme/web.app_2', issue: null });
assert.deepEqual(parseParams(search('acme/.github', '12')), { repo: 'acme/.github', issue: '12' });
assert.ok(parseParams('').empty);

// Anything that could smuggle shell syntax is refused
for (const repo of ['a/b;rm -rf ~', 'a/b c', '$(id)/b', 'a/`id`', 'a/b&&id', 'a/b|id', "a/b'", 'a/..', 'a/.', '-a/b', 'a/-b', 'a/b\n', 'a/b/c', 'a', ''])
  assert.ok(parseParams(search(repo)).error, `repo should be refused: ${JSON.stringify(repo)}`);
for (const issue of ['1;id', '0', '-1', '1 2', '$(id)', '1\n', ''])
  assert.ok(parseParams(search('a/b', issue)).error, `issue should be refused: ${JSON.stringify(issue)}`);

// A link can never turn the dangerous option on
assert.deepEqual(parseParams('repo=a/b&skip_permissions=true&cloud=false'), { repo: 'a/b', issue: null });

// Maintainer options: safe defaults, and only exact values count
const allProviders = Object.keys(PROVIDERS);
const defaults = { cloud: true, providers: allProviders, skip_permissions: false };
const front = (body) => `---\n${body}\n---\n# Instructions\n`;
assert.deepEqual(parseOptions('# No front matter\n'), defaults);
assert.deepEqual(parseOptions(''), defaults);
assert.deepEqual(parseOptions('# Title\n---\nskip_permissions: true\n---\n'), defaults, 'front matter only counts at the top');
assert.deepEqual(
  parseOptions(front('cloud: false\nproviders: claude, gemini\nskip_permissions: true')),
  { cloud: false, providers: ['claude', 'gemini'], skip_permissions: true },
);
assert.deepEqual(parseOptions('---\r\nskip_permissions: true\r\n---\r\n').skip_permissions, true);
assert.deepEqual(parseOptions(front('providers: [codex]')).providers, ['codex']);
assert.deepEqual(parseOptions(front('providers:')).providers, []);
assert.deepEqual(parseOptions(front('providers: claude, evil; rm -rf ~, __proto__, constructor')).providers, ['claude']);
for (const value of ['TRUE', 'yes', '1', 'true # sure', '"true"', ''])
  assert.equal(parseOptions(front(`skip_permissions: ${value}`)).skip_permissions, false, `should stay off: ${value}`);

// Quoting survives a real shell
const evil = `it's $(touch /tmp/x) \`id\` "q" \\ ; rm -rf ~\nline2`;
assert.equal(execFileSync('bash', ['-c', `printf %s ${shellQuote(evil)}`], { encoding: 'utf8' }), evil);

// Prompts carry the task and the right delivery instructions
assert.match(buildPrompt('a/b', '7', 'local'), /issue #7 of a\/b/);
assert.match(buildPrompt('a/b', null, 'local'), /oldest open issue of a\/b labelled take-my-tokens/);
assert.match(buildPrompt('a/b', null, 'cloud'), /repos\/a\/b\/forks/);
assert.match(buildPrompt('a/b', null, 'local'), /gh pr create --draft --repo a\/b/);
for (const prompt of [buildPrompt('a/b', '7', 'local'), buildPrompt('a/b', '7', 'cloud'), setupPrompt('https://x.test/')])
  assert.ok(!prompt.includes("'"), 'prompts avoid apostrophes so the quoted command stays readable');

// The cloud link decodes back to the exact prompt and repo
const url = new URL(cloudUrl('a/b', '7'));
assert.equal(url.origin + url.pathname, 'https://claude.ai/code');
assert.equal(url.searchParams.get('prompt'), buildPrompt('a/b', '7', 'cloud'));
assert.equal(url.searchParams.get('repositories'), 'a/b');
assert.ok(!url.href.includes(' '));

// The local command works end to end against stub CLIs, without touching GitHub
const dir = mkdtempSync(join(tmpdir(), 'take-my-tokens-'));
try {
  const stub = (name, body) => {
    writeFileSync(join(dir, name), `#!/bin/bash\n${body}\n`);
    chmodSync(join(dir, name), 0o755);
  };
  stub('gh', 'printf "%s\\n" "$*" > "$OUT_DIR/gh.args"; mkdir -p "${3##*/}"');
  for (const name of ['claude', 'codex', 'gemini']) stub(name, `printf "%s" "${name}|$PWD|$*" > "$OUT_DIR/agent.args"`);

  const run = (command, cwd) => execFileSync('bash', ['-c', command], {
    cwd,
    env: { ...process.env, PATH: dir + delimiter + process.env.PATH, OUT_DIR: dir },
  });
  const agentCall = () => {
    const [name, cwd, ...rest] = readFileSync(join(dir, 'agent.args'), 'utf8').split('|');
    return { name, cwd, args: rest.join('|') };
  };
  const pageUrl = 'https://example.github.io/take/';
  const safeArgs = { claude: '', codex: '', gemini: '-i ' };
  const autoArgs = {
    claude: '--permission-mode auto ',
    codex: '--approve-for-me ',
    gemini: '--approval-mode=auto_edit -i ',
  };
  const skipArgs = {
    claude: '--dangerously-skip-permissions ',
    codex: '--dangerously-bypass-approvals-and-sandbox ',
    gemini: '--approval-mode=yolo -i ',
  };

  for (const provider of allProviders) {
    for (const [mode, flags] of [['ask', safeArgs], ['auto', autoArgs], ['skip', skipArgs]]) {
      const work = mkdtempSync(join(dir, 'work-'));
      const command = localCommand(provider, 'acme/web.app', '7', mode);
      assert.ok(!/[\r\n]/.test(command), 'the command must stay on one line');
      run(command, work);
      assert.equal(readFileSync(join(dir, 'gh.args'), 'utf8'), 'repo fork acme/web.app --clone\n');
      const { name, cwd, args } = agentCall();
      assert.equal(name, provider);
      assert.equal(cwd, join(work, 'web.app'));
      assert.equal(args, flags[provider] + buildPrompt('acme/web.app', '7', 'local'));
    }
    assert.equal(localCommand(provider, 'a/b', null), localCommand(provider, 'a/b', null, 'ask'), 'asking is the default');
    for (const mode of ['ask', 'auto']) {
      assert.ok(!/danger|yolo/.test(localCommand(provider, 'a/b', null, mode)), `${mode} must keep its safeguards`);
    }

    // The maintainer setup command runs where it is pasted and never skips approvals
    const work = mkdtempSync(join(dir, 'work-'));
    run(setupCommand(provider, pageUrl), work);
    const { cwd, args } = agentCall();
    assert.equal(cwd, work);
    assert.equal(args, safeArgs[provider] + setupPrompt(pageUrl));
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('ok');
