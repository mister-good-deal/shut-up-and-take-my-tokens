import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CLAIM_COMMENT, RULES, buildPrompt, listCommand, pullCheck, setupPrompt } from '../lib.ts';
import { missing, shells, stubTools } from './helpers.ts';

const prompt = buildPrompt('a/b', 7);

test('the task names the issue', () => {
  assert.match(prompt, /Your issue is #7/);
});

test('the task reads the issue with an exact command', () => {
  assert.match(prompt, /gh issue view 7 --repo a\/b --json title,body,state,labels,comments/);
});

test('the check reads the pull requests, with no text search that matches any number', () => {
  assert.ok(prompt.includes(pullCheck('a/b', 7)), 'the check reads the pull requests, with no text search that matches any number');
});

test('moving on reads the claims, as far as the page does', () => {
  assert.ok(prompt.includes(listCommand('a/b')), 'moving on reads the claims, as far as the page does');
  assert.match(listCommand('a/b'), /--limit 100 --json number,title,comments$/);
});

test('the earliest claim decides who works on the issue', () => {
  assert.match(prompt, /the first one listed is your own claim comment/);
});

test('the pull request is a draft on the project', () => {
  assert.match(prompt, /gh pr create --draft --repo a\/b --head OWNER:BRANCH/);
});

test('the work starts from the current state of the project', () => {
  assert.match(prompt, /git fetch https:\/\/github\.com\/a\/b\.git HEAD/);
});

test('moving on posts the same claim', () => {
  assert.ok(prompt.includes(CLAIM_COMMENT), 'moving on posts the same claim');
});

test('the task carries every rule', () => {
  for (const rule of RULES) assert.ok(prompt.includes(rule));
});

test('the address comes last, added by the command', () => {
  assert.ok(prompt.endsWith('Your claim comment for issue #7: '), 'the address comes last, added by the command');
});

test('prompts avoid apostrophes so the quoted command stays readable', () => {
  for (const text of [prompt, CLAIM_COMMENT, setupPrompt('https://x.test/')])
    assert.ok(!text.includes("'"), 'prompts avoid apostrophes so the quoted command stays readable');
});

// What the pull request check of the task counts, through a real grep
const { dir, run } = stubTools();
const mentions = (shell: string, body: string) => run(pullCheck('acme/web.app', 7), dir, shell, { PULLS: JSON.stringify([{ title: 'x', body }]) }) === 0;

for (const shell of shells) {
  describe(`the pull request check under ${shell}`, { skip: missing(shell) }, () => {
    for (const body of ['Closes #7', 'Closes #7\r\nMore', '#7\nOn its own line', 'See https://github.com/acme/web.app/issues/7.', 'gh-7: fix', 'GH-7']) {
      test(`counts ${JSON.stringify(body)}`, () => {
        assert.ok(mentions(shell, body), `should count: ${body}`);
      });
    }

    for (const body of ['Closes #71', 'Bump to 7.0', 'nothing']) {
      test(`does not count ${JSON.stringify(body)}`, () => {
        assert.ok(!mentions(shell, body), `should not count: ${body}`);
      });
    }
  });
}
