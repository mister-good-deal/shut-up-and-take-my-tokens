import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseParams } from '../lib.ts';
import { craftedRepos, search } from './helpers.ts';

test('a repository with dots and underscores is valid', () => {
  assert.deepEqual(parseParams(search('acme/web.app_2')), { repo: 'acme/web.app_2', issue: null });
});

test('a link can name an issue', () => {
  assert.deepEqual(parseParams(search('acme/.github', '12')), { repo: 'acme/.github', issue: '12' });
});

test('a link with no parameters is empty', () => {
  assert.ok(parseParams('').empty);
});

// Anything that could smuggle shell syntax is refused
for (const repo of craftedRepos) {
  test(`refuses the repository ${JSON.stringify(repo)}`, () => {
    assert.ok(parseParams(search(repo)).error, `repo should be refused: ${JSON.stringify(repo)}`);
  });
}

for (const issue of ['1;id', '0', '-1', '1 2', '$(id)', '1\n', '']) {
  test(`refuses the issue ${JSON.stringify(issue)}`, () => {
    assert.ok(parseParams(search('a/b', issue)).error, `issue should be refused: ${JSON.stringify(issue)}`);
  });
}

test('a link can never turn the dangerous option on', () => {
  assert.deepEqual(parseParams('repo=a/b&skip_permissions=true&providers=evil'), { repo: 'a/b', issue: null });
});
