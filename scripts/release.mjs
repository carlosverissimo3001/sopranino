#!/usr/bin/env node
// Bumps every package.json to one version, commits, and tags it, so the version
// the app shows and the release tag cannot drift. Pushing stays a deliberate step.
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

if (run('git branch --show-current') !== 'main') {
  fail('release from main');
}
if (run('git status --porcelain')) {
  fail('the working tree has uncommitted changes');
}
if (run(`git tag --list ${tag}`)) {
  fail(`${tag} already exists`);
}

for (const file of PACKAGES) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

run(`git add ${PACKAGES.join(' ')}`);
run(`git commit -m "chore(release): ${tag}"`);
run(`git tag -a ${tag} -m "${tag}"`);

console.log(`Tagged ${tag}. Next: git push origin main ${tag}`);
