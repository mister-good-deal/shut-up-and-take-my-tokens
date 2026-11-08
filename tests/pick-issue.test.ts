import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickIssue } from '../lib.ts';
import { issue } from './helpers.ts';

const pick = (over: object) => pickIssue({ repo: 'a/b', named: null, issues: [issue(1), issue(2), issue(3)], pulls: [], claims: new Set(), random: () => 0, ...over });

test('offers an issue when nothing is taken', () => {
  assert.equal(pick({}).issue.number, 1);
});

test('visitors spread over the available issues', () => {
  assert.equal(pick({ random: () => 0.99 }).issue.number, 3, 'visitors spread over the available issues');
});

test('counts the available and the taken issues', () => {
  assert.deepEqual(pick({ claims: new Set([1]) }).counts, { available: 2, taken: 1 });
});

test('a claimed issue is not offered', () => {
  assert.equal(pick({ claims: new Set([1]) }).issue.number, 2, 'a claimed issue is not offered');
});

test('an issue with an open pull request is not offered', () => {
  assert.equal(pick({ pulls: [{ title: 'Fix #1', body: '' }] }).issue.number, 2, 'an issue with an open pull request is not offered');
});

test('a number of another repository takes nothing', () => {
  assert.equal(pick({ pulls: [{ title: 'Bump', body: 'other/project#1' }] }).issue.number, 1, 'a number of another repository takes nothing');
});

test('pull requests are not issues', () => {
  assert.equal(pick({ issues: [issue(1, { pull_request: {} }), issue(2)] }).issue.number, 2, 'pull requests are not issues');
});

test('pull requests are not counted', () => {
  assert.deepEqual(pick({ issues: [issue(1, { pull_request: {} }), issue(2)] }).counts, { available: 1, taken: 0 });
});

test('only integer numbers can reach a command', () => {
  assert.equal(pick({ issues: [issue('1;id'), issue(2)] }).issue.number, 2, 'only integer numbers can reach a command');
});

test('nothing is offered when every issue is claimed', () => {
  assert.equal(pick({ claims: new Set([1, 2, 3]) }).issue, null);
});

test('nothing is offered when there are no issues', () => {
  assert.equal(pick({ issues: [] }).issue, null);
});

test('a free named issue is offered', () => {
  assert.deepEqual(pick({ named: '2' }), { issue: issue(2), counts: { available: 3, taken: 0 }, namedProblem: null });
});

test('a taken named issue gives way to another, and says so', () => {
  assert.deepEqual(pick({ named: '2', claims: new Set([2]) }), { issue: issue(1), counts: { available: 2, taken: 1 }, namedProblem: 'taken' });
});

test('a named issue that is not approved gives way to another, and says so', () => {
  assert.deepEqual(pick({ named: '9' }), { issue: issue(1), counts: { available: 3, taken: 0 }, namedProblem: 'not-approved' });
});

test('a taken named issue with no other available offers nothing', () => {
  assert.equal(pick({ named: '2', issues: [issue(2)], claims: new Set([2]) }).issue, null);
});
