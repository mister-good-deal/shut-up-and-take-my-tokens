import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLAIM_COMMENT, MARKER, commentsUrl, liveClaims } from '../lib.js';
import { claim, now } from './helpers.ts';

test('the claim comment starts with the marker', () => {
  assert.ok(CLAIM_COMMENT.startsWith(MARKER));
});

test('a claim ends at 24 hours', () => {
  assert.deepEqual([...liveClaims([claim(1, 1), claim(2, 23.9), claim(3, 24), claim(4, 30)], now)], [1, 2], 'a claim ends at 24 hours');
});

test('the marker must start the body', () => {
  assert.deepEqual([...liveClaims([claim(1, 1, `Quoting: ${MARKER}`), claim(2, 1, null), claim(3, 1, 'nothing')], now)], [], 'the marker must start the body');
});

test('malformed comments count for nothing', () => {
  assert.deepEqual([...liveClaims([{ ...claim(1, 1), issue_url: 'https://evil.test/issues/1;id' }, { ...claim(2, 1), created_at: 'soon' }], now)], [], 'malformed comments count for nothing');
});

test('comments are read from 24 hours back', () => {
  assert.match(commentsUrl('a/b', now), /since=2026-11-06T12:00:00\.000Z/);
});
