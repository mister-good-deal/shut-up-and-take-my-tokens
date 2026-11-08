import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupCommand, setupPrompt, setupSteps } from '../lib.ts';
import { allProviders, safeArgs, stubTools } from './helpers.ts';

const { run, agentCall, workspace } = stubTools();
const pageUrl = 'https://example.github.io/take/';

test('the setup asks at most 5 questions', () => {
  assert.ok(setupSteps('https://x.test/').filter((step) => /\?(\s|$)/.test(step)).length <= 5, 'at most 5 questions');
});

test('the setup never mentions a cloud', () => {
  assert.ok(!/cloud/i.test(setupPrompt('https://x.test/')));
});

for (const provider of allProviders) {
  test(`the ${provider} setup command runs where it is pasted and never skips approvals`, () => {
    const work = workspace();
    run(setupCommand(provider, pageUrl), work);
    const { cwd, args } = agentCall()!;
    assert.equal(cwd, work);
    assert.equal(args, safeArgs[provider] + setupPrompt(pageUrl));
  });
}
