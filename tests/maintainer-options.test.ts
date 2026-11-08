import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseOptions } from '../lib.ts';
import { allProviders, front } from './helpers.ts';

const defaults = { providers: allProviders, skip_permissions: false };

test('a file with no front matter gets the safe defaults', () => {
  assert.deepEqual(parseOptions('# No front matter\n'), defaults);
});

test('an empty file gets the safe defaults', () => {
  assert.deepEqual(parseOptions(''), defaults);
});

test('front matter only counts at the top', () => {
  assert.deepEqual(parseOptions('# Title\n---\nskip_permissions: true\n---\n'), defaults, 'front matter only counts at the top');
});

test('front matter sets the providers and skip_permissions', () => {
  assert.deepEqual(parseOptions(front('providers: claude, gemini\nskip_permissions: true')), { providers: ['claude', 'gemini'], skip_permissions: true });
});

test('unknown keys are ignored', () => {
  assert.deepEqual(parseOptions(front('cloud: false')), defaults, 'unknown keys are ignored');
});

test('front matter with Windows line endings counts', () => {
  assert.deepEqual(parseOptions('---\r\nskip_permissions: true\r\n---\r\n').skip_permissions, true);
});

test('providers can be written as a list in brackets', () => {
  assert.deepEqual(parseOptions(front('providers: [codex]')).providers, ['codex']);
});

test('an empty providers line turns every provider off', () => {
  assert.deepEqual(parseOptions(front('providers:')).providers, []);
});

test('only known providers are kept', () => {
  assert.deepEqual(parseOptions(front('providers: claude, evil; rm -rf ~, __proto__, constructor')).providers, ['claude']);
});

for (const value of ['TRUE', 'yes', '1', 'true # sure', '"true"', '']) {
  test(`skip_permissions stays off for ${JSON.stringify(value)}`, () => {
    assert.equal(parseOptions(front(`skip_permissions: ${value}`)).skip_permissions, false, `should stay off: ${value}`);
  });
}

test('spaces around a value do not count', () => {
  assert.equal(parseOptions(front('skip_permissions:  true  ')).skip_permissions, true, 'spaces around a value do not count');
});

test('a crafted file cannot freeze the tab of a visitor', () => {
  const start = performance.now();
  parseOptions(front(`x:${' '.repeat(4000)}y\rz`));
  parseOptions(front(`x:y${' '.repeat(200000)}z`));
  assert.ok(performance.now() - start < 1000, 'crafted lines must parse fast');
});
