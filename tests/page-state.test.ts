import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageState } from '../lib.js';
import { FILE, claim, craftedRepos, fakeGitHub, front, issue, now, search } from './helpers.ts';

const state = (query: string, github: { fetchFn: (url: string) => Promise<unknown> } = fakeGitHub()) => pageState(query, github.fetchFn, now, () => 0);

test('a link with no parameters shows the setup', async () => {
  assert.deepEqual(await state(''), { view: 'setup' });
});

test('an invalid link reaches nothing', async () => {
  const github = fakeGitHub();
  assert.ok((await state('repo=a/b;id', github)).error);
  assert.equal(github.calls.length, 0, 'an invalid link reaches nothing');
});

test('a project without the file spends no API call', async () => {
  const github = fakeGitHub({ fileStatus: 404 });
  assert.deepEqual(await state('repo=a/b', github), { view: 'setup', repo: 'a/b', reason: 'no-file' });
  assert.deepEqual(github.calls, [FILE], 'a project without the file spends no API call');
});

test('a project that turned everything off spends no API call', async () => {
  const github = fakeGitHub({ file: front('providers:') });
  assert.deepEqual(await state('repo=a/b', github), { view: 'refused', repo: 'a/b', reason: 'off' });
  assert.deepEqual(github.calls, [FILE], 'a project that turned everything off spends no API call');
});

test('a file that cannot be read offers nothing', async () => {
  assert.equal((await state('repo=a/b', fakeGitHub({ fileStatus: 500 }))).reason, 'unreadable');
});

test('the limit on anonymous requests offers nothing', async () => {
  assert.equal((await state('repo=a/b', fakeGitHub({ apiStatus: 403 }))).reason, 'unreadable', 'the limit on anonymous requests offers nothing');
});

test('an answer that is not a list offers nothing', async () => {
  assert.equal((await state('repo=a/b', fakeGitHub({ issues: { message: 'nope' } }))).reason, 'unreadable');
});

test('a network failure offers nothing', async () => {
  assert.equal((await state('repo=a/b', { fetchFn: async () => { throw new TypeError('offline'); } })).reason, 'unreadable');
});

test('a project with no approved issue is refused', async () => {
  assert.deepEqual(await state('repo=a/b', fakeGitHub({ issues: [] })), { view: 'refused', repo: 'a/b', reason: 'none-approved', counts: { available: 0, taken: 0 } });
});

test('a project with every issue claimed is refused', async () => {
  assert.deepEqual(await state('repo=a/b', fakeGitHub({ comments: [claim(1, 2)] })), { view: 'refused', repo: 'a/b', reason: 'all-taken', counts: { available: 0, taken: 1 } });
});

test('an expired claim frees the issue', async () => {
  assert.equal((await state('repo=a/b', fakeGitHub({ comments: [claim(1, 30)] }))).view, 'task', 'an expired claim frees the issue');
});

test('an open pull request outlives its claim', async () => {
  assert.equal((await state('repo=a/b', fakeGitHub({ comments: [claim(1, 30)], pulls: [{ title: '#1', body: '' }] }))).reason, 'all-taken', 'an open pull request outlives its claim');
});

test('a claimed named issue gives way to a free one, with the options of the project', async () => {
  const task = await state('repo=a/b&issue=1', fakeGitHub({ issues: [issue(1), issue(2)], comments: [claim(1, 1)] }));
  assert.equal(task.view, 'task');
  assert.equal(task.issue.number, 2);
  assert.equal(task.namedProblem, 'taken');
  assert.deepEqual(task.options, { providers: ['claude'], skip_permissions: false });
});

// Crafted links change neither what is offered nor the command
for (const extra of ['&skip_permissions=true', '&providers=evil', '&prompt=rm%20-rf', '&mode=skip', '&cloud=true', '&command=id']) {
  test(`the extra parameter ${extra} changes nothing`, async () => {
    const plain = await state('repo=a/b');
    assert.deepEqual(await state(`repo=a/b${extra}`), plain, `should change nothing: ${extra}`);
  });
}

for (const repo of craftedRepos) {
  test(`the crafted repository ${JSON.stringify(repo)} is offered nothing`, async () => {
    assert.equal((await state(search(repo))).view, 'setup', `should offer nothing: ${JSON.stringify(repo)}`);
  });
}
