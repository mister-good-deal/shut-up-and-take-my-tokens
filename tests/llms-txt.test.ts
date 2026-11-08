import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CLAIM_COMMENT, RULES, claimSteps, deliverySteps, instructionsUrl, listCommand, prepareSteps, pullCheck, setupSteps } from '../lib.js';

const llms = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');

test('llms.txt says exactly what the page tells agents', () => {
  const shared = [
    ...claimSteps('R', 'N'), ...deliverySteps('R'), ...RULES, CLAIM_COMMENT,
    ...setupSteps('https://mister-good-deal.github.io/shut-up-and-take-my-tokens/'),
  ];
  for (const text of shared) assert.ok(llms.includes(text), `llms.txt has drifted from: ${text}`);
});

test('llms.txt holds the exact commands of the page', () => {
  const commands = [`curl -fsS ${instructionsUrl('R')}`, listCommand('R'), pullCheck('R', 'N'), ...prepareSteps('R', 'FOLDER')];
  for (const text of commands) assert.ok(llms.includes(`    ${text}\n`), `llms.txt has drifted from: ${text}`);
});

test('llms.txt puts what stops an agent before what leaves a trace, as on the page', () => {
  const order = ['providers line', listCommand('R'), prepareSteps('R', 'FOLDER')[0], 'gh issue comment N'].map((text) => llms.indexOf(text));
  assert.ok(order[0] >= 0 && order.every((at, index) => index === 0 || at > order[index - 1]), `llms.txt steps are out of order: ${order}`);
});

test('llms.txt forbids widening permissions', () => {
  assert.match(llms, /Do not widen your own permissions/);
});
