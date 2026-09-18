#!/usr/bin/env node
// Bumps every package.json to one version, commits, and tags it, so the version
// the app shows and the release tag cannot drift.
//
// main is protected, so the bump cannot be pushed to it directly: it goes
// through a pull request, which squashes it into a commit that did not exist
// when the tag was written. So the tag is only ever written once the commit is
// on main, and from a release branch this stops after the commit and says what
// comes next.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PACKAGES = [
  'package.json',
  'frontend/package.json',
  'backend/package.json',
];
const SEMVER = /^\d+\.\d+\.\d+$/;

const run = (command) => execSync(command, { encoding: 'utf8' }).trim();
const fail = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};

const version = process.argv[2]?.replace(/^v/, '');
if (!version || !SEMVER.test(version)) {
  fail('usage: pnpm release <major.minor.patch>');
}
const tag = `v${version}`;
const releaseBranch = `release/${version}`;

const branch = run('git branch --show-current');
if (branch !== 'main' && branch !== releaseBranch) {
  fail(`release from main or from ${releaseBranch}, not ${branch}`);
}
if (run('git status --porcelain')) {
  fail('the working tree has uncommitted changes');
}
if (run(`git tag --list ${tag}`)) {
  fail(`${tag} already exists`);
}

/** True once the commit being tagged is the one the remote has on main. */
const onMain =
  branch === 'main' &&
  run('git rev-parse HEAD') === run('git rev-parse origin/main');

// Bumping on main would leave a commit that cannot be pushed there, so the
// branch is cut first and the bump belongs to it.
if (branch === 'main' && !isBumped()) {
  run(`git switch -c ${releaseBranch}`);
  console.log(`Cut ${releaseBranch}.`);
}

function isBumped() {
  return PACKAGES.every(
    (file) => JSON.parse(readFileSync(file, 'utf8')).version === version,
  );
}

if (isBumped()) {
  if (branch !== 'main') {
    fail(`every package.json already reads ${version}`);
  }
  if (!onMain) {
    fail('main is behind the remote: git pull, then run this again');
  }

  // The bump has been merged: this run is only here to write the tag.
  run(`git tag -a ${tag} -m "${tag}"`);
  console.log(`Tagged ${tag} on main. Next: git push origin ${tag}`);
  process.exit(0);
}

for (const file of PACKAGES) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

run(`git add ${PACKAGES.join(' ')}`);
run(`git commit -m "chore(release): ${tag}"`);

console.log(
  [
    `Committed the bump to ${version}. It is not tagged yet: the merge will`,
    'rewrite this commit, and a tag on a commit main never gets is the trap',
    'this avoids.',
    '',
    'Next:',
    `  git push -u origin ${run('git branch --show-current')}`,
    `  gh pr create --title "chore(release): ${tag}" --base main`,
    '',
    'Once it has merged:',
    `  git checkout main && git pull`,
    `  pnpm release ${version}   # writes the tag, now that main has the commit`,
    `  git push origin ${tag}`,
  ].join('\n'),
);
