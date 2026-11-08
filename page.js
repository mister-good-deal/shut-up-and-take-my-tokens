// DOM wiring only. Decisions live in lib.js, where npm test can reach them.
// Text from GitHub only ever goes through textContent.
import { PROVIDERS, badge, issuePageUrl, localCommand, pageState, setupCommand } from './lib.js';

const $ = (id) => document.getElementById(id);
const pageUrl = location.origin + location.pathname;
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function stampToken(ring, center) {
  const circumference = 2 * Math.PI * 77;
  const stamp = `${ring} ★ `;
  const fitting = Math.round(circumference / 8.6);
  const text = stamp.repeat(Math.max(1, Math.round(fitting / stamp.length)));
  $('stamp').textContent = text;
  $('stamp').setAttribute('textLength', circumference);
  // Short stamps open up their letter spacing; only long ones get their glyphs squeezed.
  $('stamp').setAttribute('lengthAdjust', text.length > fitting ? 'spacingAndGlyphs' : 'spacing');
  $('center').textContent = center;
  if (center.length > 4) {
    $('center').setAttribute('textLength', 100);
    $('center').setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
}

function flipToken() {
  const token = $('token');
  token.classList.remove('flip');
  token.getBoundingClientRect();
  token.classList.add('flip');
}

async function copyCommand(command, box, status, afterCopy) {
  box.textContent = command;
  box.hidden = false;
  try {
    await navigator.clipboard.writeText(command);
    status.textContent = `Copied. ${afterCopy}`;
    flipToken();
  } catch {
    status.textContent = `Your browser blocked copying. Select the command above and copy it. ${afterCopy}`;
  }
  status.scrollIntoView({ block: 'nearest' });
}

function addProviderButtons(container, providers, onPick) {
  for (const provider of providers) {
    const { label, verified } = PROVIDERS[provider];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'push';
    button.setAttribute('aria-pressed', 'false');
    button.textContent = verified === false ? `${label} (not tested yet)` : label;
    button.addEventListener('click', () => {
      for (const other of container.children) other.setAttribute('aria-pressed', String(other === button));
      onPick(provider);
    });
    container.append(button);
  }
}

function showSetup(error) {
  stampToken('shut up and take my tokens', 'T');
  $('install').hidden = false;
  if (error) {
    $('error').textContent = error;
    $('error').hidden = false;
  }
  $('snippet').textContent = badge(pageUrl);
  addProviderButtons($('setup-providers'), Object.keys(PROVIDERS), (provider) => {
    copyCommand(setupCommand(provider, pageUrl), $('setup-command'), $('setup-status'),
      `Run it at the root of your repository. Needs ${PROVIDERS[provider].bin} and a signed-in gh.`);
  });
}

function showRefusal({ repo, reason, counts }) {
  const messages = {
    off: `The maintainers of ${repo} have turned off every way to run an agent.`,
    'none-approved': `${repo} has no issue open to agents right now.`,
    'all-taken': `Agents are already working on every issue ${repo} opened to them (${counts?.taken}). Come back later.`,
    unreadable: `Could not check ${repo}. GitHub may be limiting requests from your address, so try again later.`,
  };
  stampToken(repo, '…');
  $('task').hidden = false;
  $('pitch').textContent = messages[reason];
}

function showTask({ repo, options, issue, counts, namedProblem }) {
  stampToken(repo, `#${issue.number}`);
  $('task').hidden = false;
  $('run').hidden = false;

  const name = document.createElement('b');
  name.textContent = repo;
  const link = document.createElement('a');
  link.href = issuePageUrl(repo, issue.number);
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = `#${issue.number}: ${issue.title}`;
  $('pitch').append('An AI agent works on ', name, ', issue ', link, ', with your own subscription, and opens a draft pull request.');

  const problem = { taken: 'The issue in your link is being worked on, so here is another one.', 'not-approved': 'The issue in your link is not open to agents, so here is another one.' }[namedProblem] ?? '';
  $('work').textContent = `${problem} ${plural(counts.available, 'issue')} free, ${counts.taken} being worked on.`.trim();

  // A browser can restore a radio on reload or Back, even one now hidden because the maintainer stopped offering it.
  document.querySelector('input[name="mode"][value="ask"]').checked = true;
  $('skip-option').hidden = !options.skip_permissions;
  // The clipboard holds the previous choice, so a changed mode must not leave that command on show, nor look as if it replaced it.
  $('modes').addEventListener('change', () => {
    if (!$('command').hidden) $('status').textContent = 'What you copied still has the previous level. Click your tool again to replace it.';
    $('command').hidden = true;
    for (const button of $('providers').children) button.setAttribute('aria-pressed', 'false');
  });

  addProviderButtons($('providers'), options.providers, (provider) => {
    const { label, bin } = PROVIDERS[provider];
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const how = { ask: '', auto: ' with fewer prompts', skip: ' without approval prompts' }[mode];
    copyCommand(localCommand(provider, repo, issue.number, mode), $('command'), $('status'),
      `Paste it into your terminal: it forks ${repo} into a new folder, claims the issue, then starts ${label}${how}. ${label} may first ask whether you trust that folder. Needs ${bin}, a signed-in gh, and git able to push through it (gh auth setup-git).`);
  });
}

const state = await pageState(location.search, fetch);
if (state.view === 'task') showTask(state);
else if (state.view === 'refused') showRefusal(state);
else showSetup(state.reason === 'no-file' ? `${state.repo} has no TAKE_MY_TOKENS.md, so its maintainers have not opened it to agents.` : state.error);
