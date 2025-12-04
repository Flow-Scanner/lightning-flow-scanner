const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine which package to tag based on current directory or argument
const packagePath = process.argv[2] || process.cwd();
const pkgJsonPath = path.join(packagePath, 'package.json');

if (!fs.existsSync(pkgJsonPath)) {
  console.error('package.json not found at:', pkgJsonPath);
  process.exit(1);
}

const { version } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

// Always use "core-v" prefix for core package
const tag = `core-v${version}`;

try {
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
  execSync('git push --tags', { stdio: 'inherit' });
  console.log(`✓ Tagged and pushed ${tag}`);
} catch (error) {
  console.error('Failed to tag and push');
  process.exit(1);
}