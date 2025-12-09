// scripts/publish-action-tag.js  ← SAVE HERE IN ROOT
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// This is the ONLY path that works in your fresh clone
const pkgPath = path.join(__dirname, '..', 'packages', 'action', 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('ERROR: Cannot find packages/action/package.json');
  console.error('Expected path:', pkgPath);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;
const tag = `action-v${version}`;
console.log(`Creating action tag: ${tag}`);

try {
  // Delete old tag — FULLY IGNORE ANY ERROR (Windows + tag doesn't exist)
  try {
    execSync(`git tag -d "${tag}"`, { stdio: 'ignore' });
  } catch (_) {}
  // Create tag
  execSync(`git tag "${tag}"`, { stdio: 'inherit' });
  // Push ONLY this tag
  execSync(`git push origin "${tag}" --force`, { stdio: 'inherit' });
  console.log(`${tag} created and pushed successfully!`);
} catch (err) {
  console.error('Failed to create tag:', err.message);
  process.exit(1);
}