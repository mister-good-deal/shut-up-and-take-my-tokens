// Run with: node lib.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CLAIM_COMMENT, MARKER, PROVIDERS, RULES, badge, buildPrompt, claimSteps, commentsUrl, deliverySteps, instructionsUrl, issuesUrl,
  listCommand, liveClaims, localCommand, pageState, parseOptions, parseParams, pickIssue, prepareSteps, pullCheck, pullsUrl,
  referencedIssues, setupCommand, setupPrompt, setupSteps, shellQuote,
} from './lib.js';

const search = (/** @type {string} */ repo, /** @type {string=} */ issue) => new URLSearchParams({ repo, ...(issue === undefined ? {} : { issue }) }).toString();

// Valid input
assert.deepEqual(parseParams(search('acme/web.app_2')), { repo: 'acme/web.app_2', issue: null });
assert.deepEqual(parseParams(search('acme/.github', '12')), { repo: 'acme/.github', issue: '12' });
assert.ok(parseParams('').empty);

// Anything that could smuggle shell syntax is refused
const craftedRepos = ['a/b;rm -rf ~', 'a/b c', '$(id)/b', 'a/`id`', 'a/b&&id', 'a/b|id', "a/b'", 'a/..', 'a/.', '-a/b', 'a/-b', 'a/b\n', 'a/b/c', 'a', ''];
const craftedIssues = ['1;id', '0', '-1', '1 2', '$(id)', '1\n', ''];
for (const repo of craftedRepos) assert.ok(parseParams(search(repo)).error, `repo should be refused: ${JSON.stringify(repo)}`);
for (const issue of craftedIssues) assert.ok(parseParams(search('a/b', issue)).error, `issue should be refused: ${JSON.stringify(issue)}`);

// A link can never turn the dangerous option on
assert.deepEqual(parseParams('repo=a/b&skip_permissions=true&providers=evil'), { repo: 'a/b', issue: null });

// Maintainer options: safe defaults, and only exact values count
const allProviders = Object.keys(PROVIDERS);
const defaults = { providers: allProviders, skip_permissions: false };
const front = (body) => `---\n${body}\n---\n# Instructions\n`;
assert.deepEqual(parseOptions('# No front matter\n'), defaults);
assert.deepEqual(parseOptions(''), defaults);
assert.deepEqual(parseOptions('# Title\n---\nskip_permissions: true\n---\n'), defaults, 'front matter only counts at the top');
assert.deepEqual(parseOptions(front('providers: claude, gemini\nskip_permissions: true')), { providers: ['claude', 'gemini'], skip_permissions: true });
assert.deepEqual(parseOptions(front('cloud: false')), defaults, 'unknown keys are ignored');
assert.deepEqual(parseOptions('---\r\nskip_permissions: true\r\n---\r\n').skip_permissions, true);
assert.deepEqual(parseOptions(front('providers: [codex]')).providers, ['codex']);
assert.deepEqual(parseOptions(front('providers:')).providers, []);
assert.deepEqual(parseOptions(front('providers: claude, evil; rm -rf ~, __proto__, constructor')).providers, ['claude']);
for (const value of ['TRUE', 'yes', '1', 'true # sure', '"true"', ''])
  assert.equal(parseOptions(front(`skip_permissions: ${value}`)).skip_permissions, false, `should stay off: ${value}`);
assert.equal(parseOptions(front('skip_permissions:  true  ')).skip_permissions, true, 'spaces around a value do not count');

// A crafted file cannot freeze the visitor's tab
{
  const start = performance.now();
  parseOptions(front(`x:${' '.repeat(4000)}y\rz`));
  parseOptions(front(`x:y${' '.repeat(200000)}z`));
  assert.ok(performance.now() - start < 1000, 'crafted lines must parse fast');
}

// Issues already referenced by an open pull request
assert.deepEqual(
  [...referencedIssues([{ title: 'Fix #3', body: null }, { title: 'x', body: 'See https://github.com/a/b/issues/4 and #5, not #x or 6' }], 'a/b')],
  [3, 4, 5],
);
assert.deepEqual([...referencedIssues([{ title: '(#1) gh-2 GH-3', body: 'a/b#4 A/B#5 https://github.com/A/b/issues/6 [#7] done' }], 'a/b')], [1, 2, 3, 4, 5, 6, 7]);
assert.deepEqual(
  [...referencedIssues([{ title: 'Bump pflag', body: 'spf13/pflag#452 https://github.com/github/codeql-action/issues/4286 <a href="https://x.test/4284">#4284</a> [#77](https://github.com/x/y/issues/77) &#8203; x-a/b#6 pgh-8' }], 'a/b')],
  [],
  'the numbers of other repositories take nothing',
);
assert.deepEqual([...referencedIssues([{ title: 'a/bxc#9 https://github.com/a/bxc/issues/10', body: '' }], 'a/b.c')], [], 'a dot in a repository name is a dot');

// Claims: the marker at the very start, younger than 24 hours, on a well-formed issue
const now = Date.parse('2026-11-07T12:00:00Z');
const HOUR = 3600 * 1000;
const claim = (issue, ageHours, body = CLAIM_COMMENT) => ({
  body,
  issue_url: `https://api.github.com/repos/a/b/issues/${issue}`,
  created_at: new Date(now - ageHours * HOUR).toISOString(),
});
assert.ok(CLAIM_COMMENT.startsWith(MARKER));
assert.deepEqual([...liveClaims([claim(1, 1), claim(2, 23.9), claim(3, 24), claim(4, 30)], now)], [1, 2], 'a claim ends at 24 hours');
assert.deepEqual([...liveClaims([claim(1, 1, `Quoting: ${MARKER}`), claim(2, 1, null), claim(3, 1, 'nothing')], now)], [], 'the marker must start the body');
assert.deepEqual([...liveClaims([{ ...claim(1, 1), issue_url: 'https://evil.test/issues/1;id' }, { ...claim(2, 1), created_at: 'soon' }], now)], [], 'malformed comments count for nothing');
assert.match(commentsUrl('a/b', now), /since=2026-11-06T12:00:00\.000Z/);

// Picking the issue
const issue = (/** @type {number | string} */ number, extra = {}) => ({ number, title: `Issue ${number}`, ...extra });
/** @type {(over: object) => { issue: { number: number }, counts: object }} */
const pick = (over) => pickIssue({ repo: 'a/b', named: null, issues: [issue(1), issue(2), issue(3)], pulls: [], claims: new Set(), random: () => 0, ...over });
assert.equal(pick({}).issue.number, 1);
assert.equal(pick({ random: () => 0.99 }).issue.number, 3, 'visitors spread over the available issues');
assert.deepEqual(pick({ claims: new Set([1]) }).counts, { available: 2, taken: 1 });
assert.equal(pick({ claims: new Set([1]) }).issue.number, 2, 'a claimed issue is not offered');
assert.equal(pick({ pulls: [{ title: 'Fix #1', body: '' }] }).issue.number, 2, 'an issue with an open pull request is not offered');
assert.equal(pick({ pulls: [{ title: 'Bump', body: 'other/project#1' }] }).issue.number, 1, 'a number of another repository takes nothing');
assert.equal(pick({ issues: [issue(1, { pull_request: {} }), issue(2)] }).issue.number, 2, 'pull requests are not issues');
assert.deepEqual(pick({ issues: [issue(1, { pull_request: {} }), issue(2)] }).counts, { available: 1, taken: 0 });
assert.equal(pick({ issues: [issue('1;id'), issue(2)] }).issue.number, 2, 'only integer numbers can reach a command');
assert.equal(pick({ claims: new Set([1, 2, 3]) }).issue, null);
assert.equal(pick({ issues: [] }).issue, null);
assert.deepEqual(pick({ named: '2' }), { issue: issue(2), counts: { available: 3, taken: 0 }, namedProblem: null });
assert.deepEqual(pick({ named: '2', claims: new Set([2]) }), { issue: issue(1), counts: { available: 2, taken: 1 }, namedProblem: 'taken' });
assert.deepEqual(pick({ named: '9' }), { issue: issue(1), counts: { available: 3, taken: 0 }, namedProblem: 'not-approved' });
assert.equal(pick({ named: '2', issues: [issue(2)], claims: new Set([2]) }).issue, null);

// What the page shows, against a fake GitHub
const FILE = instructionsUrl('a/b');
function fakeGitHub({ file = front('providers: claude'), fileStatus = 200, issues = [issue(1)], pulls = [], comments = [], apiStatus = 200 } = {}) {
  const calls = [];
  const respond = (/** @type {number} */ status, /** @type {unknown} */ body) => Promise.resolve({
    status,
    ok: status < 400,
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(body),
  });
  const fetchFn = (/** @type {string} */ url) => {
    calls.push(url);
    if (url === FILE) return respond(fileStatus, file);
    if (url === issuesUrl('a/b')) return respond(apiStatus, issues);
    if (url === pullsUrl('a/b')) return respond(apiStatus, pulls);
    if (url === commentsUrl('a/b', now)) return respond(apiStatus, comments);
    return Promise.reject(new Error(`unexpected request: ${url}`));
  };
  return { fetchFn, calls };
}
const state = (query, github = fakeGitHub()) => pageState(query, github.fetchFn, now, () => 0);

assert.deepEqual(await state(''), { view: 'setup' });
{
  const github = fakeGitHub();
  assert.ok((await state('repo=a/b;id', github)).error);
  assert.equal(github.calls.length, 0, 'an invalid link reaches nothing');
}
{
  const github = fakeGitHub({ fileStatus: 404 });
  assert.deepEqual(await state('repo=a/b', github), { view: 'setup', repo: 'a/b', reason: 'no-file' });
  assert.deepEqual(github.calls, [FILE], 'a project without the file spends no API call');
}
{
  const github = fakeGitHub({ file: front('providers:') });
  assert.deepEqual(await state('repo=a/b', github), { view: 'refused', repo: 'a/b', reason: 'off' });
  assert.deepEqual(github.calls, [FILE], 'a project that turned everything off spends no API call');
}
assert.equal((await state('repo=a/b', fakeGitHub({ fileStatus: 500 }))).reason, 'unreadable');
assert.equal((await state('repo=a/b', fakeGitHub({ apiStatus: 403 }))).reason, 'unreadable', 'the limit on anonymous requests offers nothing');
assert.equal((await state('repo=a/b', fakeGitHub({ issues: { message: 'nope' } }))).reason, 'unreadable');
assert.equal((await state('repo=a/b', { fetchFn: () => Promise.reject(new TypeError('offline')) })).reason, 'unreadable');
assert.deepEqual(await state('repo=a/b', fakeGitHub({ issues: [] })), { view: 'refused', repo: 'a/b', reason: 'none-approved', counts: { available: 0, taken: 0 } });
assert.deepEqual(await state('repo=a/b', fakeGitHub({ comments: [claim(1, 2)] })), { view: 'refused', repo: 'a/b', reason: 'all-taken', counts: { available: 0, taken: 1 } });
assert.equal((await state('repo=a/b', fakeGitHub({ comments: [claim(1, 30)] }))).view, 'task', 'an expired claim frees the issue');
assert.equal((await state('repo=a/b', fakeGitHub({ comments: [claim(1, 30)], pulls: [{ title: '#1', body: '' }] }))).reason, 'all-taken', 'an open pull request outlives its claim');
{
  const task = await state('repo=a/b&issue=1', fakeGitHub({ issues: [issue(1), issue(2)], comments: [claim(1, 1)] }));
  assert.equal(task.view, 'task');
  assert.equal(/** @type {{ issue: { number: number } }} */ (task).issue.number, 2);
  assert.equal(task.namedProblem, 'taken');
  assert.deepEqual(task.options, { providers: ['claude'], skip_permissions: false });
}

// Crafted links change neither what is offered nor the command
{
  const plain = await state('repo=a/b');
  for (const extra of ['&skip_permissions=true', '&providers=evil', '&prompt=rm%20-rf', '&mode=skip', '&cloud=true', '&command=id'])
    assert.deepEqual(await state(`repo=a/b${extra}`), plain, `should change nothing: ${extra}`);
  for (const repo of craftedRepos) assert.equal((await state(search(repo))).view, 'setup', `should offer nothing: ${JSON.stringify(repo)}`);
}

// Quoting survives a real shell. Harmless on purpose: if quoting ever breaks, this text really runs, on the machine of whoever runs the tests.
const evil = `it's $(echo sub) \`echo tick\` "q" \\ ; echo semi\nline2`;
assert.equal(execFileSync('bash', ['-c', `printf %s ${shellQuote(evil)}`], { encoding: 'utf8' }), evil);

// The task carries the workflow, with exact commands and concrete values
{
  const prompt = buildPrompt('a/b', 7);
  assert.match(prompt, /Your issue is #7/);
  assert.match(prompt, /gh issue view 7 --repo a\/b --json title,body,state,labels,comments/);
  assert.ok(prompt.includes(pullCheck('a/b', 7)), 'the check reads the pull requests, with no text search that matches any number');
  assert.ok(prompt.includes(listCommand('a/b')), 'moving on reads the claims, as far as the page does');
  assert.match(listCommand('a/b'), /--limit 100 --json number,title,comments$/);
  assert.match(prompt, /the first one listed is your own claim comment/);
  assert.match(prompt, /gh pr create --draft --repo a\/b --head OWNER:BRANCH/);
  assert.match(prompt, /git fetch https:\/\/github\.com\/a\/b\.git HEAD/);
  assert.ok(prompt.includes(CLAIM_COMMENT), 'moving on posts the same claim');
  for (const rule of RULES) assert.ok(prompt.includes(rule));
  assert.ok(prompt.endsWith('Your claim comment for issue #7: '), 'the address comes last, added by the command');
  for (const text of [prompt, CLAIM_COMMENT, setupPrompt('https://x.test/')])
    assert.ok(!text.includes("'"), 'prompts avoid apostrophes so the quoted command stays readable');
}

// The badge counts approved issues live and names no issue
assert.equal(
  badge('https://x.test/', 'a/b'),
  '[![take my tokens](https://img.shields.io/github/issues/a/b/take-my-tokens?label=take%20my%20tokens&color=E5B53F)](https://x.test/?repo=a/b)',
);

// The setup asks little
assert.ok(setupSteps('https://x.test/').filter((step) => /\?(\s|$)/.test(step)).length <= 5, 'at most 5 questions');
assert.ok(!/cloud/i.test(setupPrompt('https://x.test/')));

// The instructions for agents say exactly what the page tells them
{
  const llms = readFileSync(new URL('./llms.txt', import.meta.url), 'utf8');
  const shared = [
    ...claimSteps('R', 'N'), ...deliverySteps('R'), ...RULES, CLAIM_COMMENT,
    ...setupSteps('https://mister-good-deal.github.io/shut-up-and-take-my-tokens/'),
  ];
  for (const text of shared) assert.ok(llms.includes(text), `llms.txt has drifted from: ${text}`);
  const commands = [`curl -fsS ${instructionsUrl('R')}`, listCommand('R'), pullCheck('R', 'N'), ...prepareSteps('R', 'FOLDER')];
  for (const text of commands) assert.ok(llms.includes(`    ${text}\n`), `llms.txt has drifted from: ${text}`);
  // What stops an agent comes before what leaves a trace, as on the page
  const order = ['providers line', listCommand('R'), prepareSteps('R', 'FOLDER')[0], 'gh issue comment N'].map((text) => llms.indexOf(text));
  assert.ok(order[0] >= 0 && order.every((at, index) => index === 0 || at > order[index - 1]), `llms.txt steps are out of order: ${order.join()}`);
  assert.match(llms, /Do not widen your own permissions/);
}

// The page reaches no third party on its own
{
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /script-src 'self';/);
  assert.ok(!/<script(?![^>]*\ssrc=)/.test(html), 'no inline script');
  assert.ok(!/(?:src|href)="https?:|url\(https?:/.test(html), 'no remote resource');
  for (const font of html.matchAll(/url\((fonts\/[^)]+)\)/g)) assert.ok(existsSync(new URL(`./${font[1]}`, import.meta.url)), `missing ${font[1]}`);
}

// The local command works end to end against stub CLIs, without touching GitHub, in every shell it targets
// realpath because the shell reports the real path, and a temporary folder can sit behind a symlink, as it does on macOS.
const dir = realpathSync(mkdtempSync(join(tmpdir(), 'take-my-tokens-')));
try {
  const stub = (/** @type {string} */ name, /** @type {string} */ body) => {
    writeFileSync(join(dir, name), `#!/bin/bash\n${body}\n`);
    chmodSync(join(dir, name), 0o755);
  };
  const CLAIM_URL = 'https://github.com/acme/web.app/issues/7#issuecomment-99';
  stub('gh', `printf "%s\\n" "$*" >> "$OUT_DIR/calls.log"
case "$1 $2" in
  "repo fork") [ -z "$FAIL_FORK" ] && mkdir "$6" ;;
  "repo clone") [ -z "$FAIL_CLONE" ] && mkdir "$4" ;;
  "issue comment") [ -z "$FAIL_COMMENT" ] && echo "${CLAIM_URL}" ;;
  "pr list") printf "%s" "$PULLS" ;;
esac`);
  stub('git', `printf "%s\\n" "git $*" >> "$OUT_DIR/calls.log"
[ -z "$FAIL_PUSH" ]`);
  for (const name of allProviders) {
    stub(name, `if [ "$1" = "--version" ]; then [ -z "$FAIL_TOOL" ]; exit; fi
printf "%s" "${name}|$PWD|$*" > "$OUT_DIR/agent.args"`);
  }

  const shells = ['bash', 'zsh'].filter((shell) => spawnSync(shell, ['--version']).status === 0);
  const reset = () => {
    for (const file of ['calls.log', 'agent.args']) rmSync(join(dir, file), { force: true });
  };
  // PATH is set inside the command: startup files (BASH_ENV, ~/.zshenv) run before it and could put the real gh and agents back ahead of the stubs.
  const run = (/** @type {string} */ command, /** @type {string} */ cwd, shell = 'bash', /** @type {Record<string, string>} */ env = {}) => {
    reset();
    return spawnSync(shell, ['-c', `PATH=${shellQuote(dir)}:"$PATH"; ${command}`], {
      cwd,
      env: { ...process.env, OUT_DIR: dir, ...env },
    }).status;
  };
  const toolCalls = () => (existsSync(join(dir, 'calls.log')) ? readFileSync(join(dir, 'calls.log'), 'utf8').trim().split('\n') : []);
  const agentCall = () => {
    if (!existsSync(join(dir, 'agent.args'))) return null;
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
  const folder = 'take-my-tokens-web.app';
  const fork = `repo fork acme/web.app --clone -- ${folder}`;
  const clone = `repo clone acme/web.app ${folder}`;
  const push = 'git push -q --dry-run origin HEAD:refs/heads/take-my-tokens-check';
  const comment = `issue comment 7 --repo acme/web.app --body ${CLAIM_COMMENT}`;

  for (const shell of shells) {
    for (const provider of allProviders) {
      for (const [mode, flags] of [['ask', safeArgs], ['auto', autoArgs], ['skip', skipArgs]]) {
        const work = mkdtempSync(join(dir, 'work-'));
        const command = localCommand(provider, 'acme/web.app', 7, mode);
        assert.ok(!/[\r\n]/.test(command), 'the command must stay on one line');
        assert.equal(run(command, work, shell), 0);
        assert.deepEqual(toolCalls(), [fork, push, comment], 'the claim goes out before the agent starts, and only if the work could be pushed');
        const { name, cwd, args } = agentCall();
        assert.equal(name, provider);
        assert.equal(cwd, join(work, folder));
        assert.equal(args, flags[provider] + buildPrompt('acme/web.app', 7) + CLAIM_URL, 'the agent receives the address of its claim');
      }
    }

    // A contributor who owns the project cannot fork it, and still reaches a clone and a claim
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.equal(run(localCommand('claude', 'acme/web.app', 7), work, shell, { FAIL_FORK: '1' }), 0);
      assert.deepEqual(toolCalls(), [fork, clone, push, comment]);
      assert.equal(agentCall().cwd, join(work, folder));
    }

    // Anyone else whose fork failed gets a clone they cannot push to, and neither a claim nor an agent
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.notEqual(run(localCommand('claude', 'acme/web.app', 7), work, shell, { FAIL_FORK: '1', FAIL_PUSH: '1' }), 0);
      assert.deepEqual(toolCalls(), [fork, clone, push]);
      assert.equal(agentCall(), null);
    }

    // A repository's name cannot choose where its files land
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.equal(run(localCommand('claude', 'evil/.bashrc.d', 7), work, shell), 0);
      assert.ok(!existsSync(join(work, '.bashrc.d')));
      assert.equal(agentCall().cwd, join(work, 'take-my-tokens-.bashrc.d'));
    }

    // A checkout of the same name elsewhere on CDPATH is left alone
    {
      const work = mkdtempSync(join(dir, 'work-'));
      const elsewhere = mkdtempSync(join(dir, 'elsewhere-'));
      mkdirSync(join(elsewhere, folder));
      assert.equal(run(localCommand('claude', 'acme/web.app', 7), work, shell, { CDPATH: elsewhere }), 0);
      assert.equal(agentCall().cwd, join(work, folder));
    }

    // A missing tool stops everything before anything is forked or posted
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.notEqual(run(localCommand('claude', 'acme/web.app', 7), work, shell, { FAIL_TOOL: '1' }), 0);
      assert.deepEqual(toolCalls(), []);
      assert.equal(agentCall(), null);
    }

    // Without a clone, for instance because the folder exists, no comment goes out
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.notEqual(run(localCommand('claude', 'acme/web.app', 7), work, shell, { FAIL_FORK: '1', FAIL_CLONE: '1' }), 0);
      assert.deepEqual(toolCalls(), [fork, clone]);
      assert.equal(agentCall(), null);
    }

    // Without a claim, for instance on a locked issue, no agent starts
    {
      const work = mkdtempSync(join(dir, 'work-'));
      assert.notEqual(run(localCommand('claude', 'acme/web.app', 7), work, shell, { FAIL_COMMENT: '1' }), 0);
      assert.equal(agentCall(), null);
    }

    // What the pull request check of the task counts, through a real grep
    {
      const mentions = (/** @type {string} */ body) => run(pullCheck('acme/web.app', 7), dir, shell, { PULLS: JSON.stringify([{ title: 'x', body }]) }) === 0;
      for (const body of ['Closes #7', 'Closes #7\r\nMore', '#7\nOn its own line', 'See https://github.com/acme/web.app/issues/7.', 'gh-7: fix', 'GH-7'])
        assert.ok(mentions(body), `should count: ${body}`);
      for (const body of ['Closes #71', 'Bump to 7.0', 'nothing']) assert.ok(!mentions(body), `should not count: ${body}`);
    }
  }

  for (const provider of allProviders) {
    for (const mode of ['ask', 'auto']) {
      assert.ok(!/danger|yolo/.test(localCommand(provider, 'a/b', 7, mode)), `${mode} must keep its safeguards`);
    }
    assert.equal(localCommand(provider, 'a/b', 7), localCommand(provider, 'a/b', 7, 'ask'), 'asking is the default');

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
