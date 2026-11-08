import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { shellQuote } from '../lib.js';

// Harmless on purpose: if quoting ever breaks, this text really runs, on the machine of whoever runs the tests.
const evil = `it's $(echo sub) \`echo tick\` "q" \\ ; echo semi\nline2`;

test('quoting survives a real shell', () => {
  assert.equal(execFileSync('bash', ['-c', `printf %s ${shellQuote(evil)}`], { encoding: 'utf8' }), evil);
});
