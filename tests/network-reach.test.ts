import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('the page sets a Content-Security-Policy', () => {
  assert.match(html, /http-equiv="Content-Security-Policy"/);
});

test('scripts come from the page alone', () => {
  assert.match(html, /script-src 'self';/);
});

test('the page has no inline script', () => {
  assert.ok(!/<script(?![^>]*\ssrc=)/.test(html), 'no inline script');
});

test('the page loads no remote resource', () => {
  assert.ok(!/(?:src|href)="https?:|url\(https?:/.test(html), 'no remote resource');
});

test('every font the page names is in the repository', () => {
  for (const font of html.matchAll(/url\((fonts\/[^)]+)\)/g)) assert.ok(existsSync(new URL(`../${font[1]}`, import.meta.url)), `missing ${font[1]}`);
});
