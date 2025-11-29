// restart-monorepo.js
// Complete restart using proper Git subtree merge strategy
// Run this in a FRESH EMPTY directory

const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  try {
    return execSync(cmd, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    if (!options.allowFail) {
      throw error;
    }
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

console.log('='.repeat(70));
console.log('CREATING MONOREPO WITH FULL HISTORY');
console.log('='.repeat(70));

// Step 1: Initialize
console.log('\n[1/10] Initializing git repository...');
run('git init');
run('git checkout -b main');

// Step 2: Create initial structure
console.log('\n[2/10] Creating initial monorepo structure...');
fs.mkdirSync('packages/cli', { recursive: true });
fs.mkdirSync('packages/core', { recursive: true });

// Create root files
writeJSON('package.json', {
  name: "lightning-flow-scanner-monorepo",
  version: "1.0.0",
  private: true,
  workspaces: ["packages/*"],
  scripts: {
    build: "turbo run build",
    test: "turbo run test",
    clean: "turbo run clean"
  },
  devDependencies: {
    turbo: "^2.3.3",
    prettier: "^3.6.2",
    rimraf: "^6.1.0"
  },
  engines: { node: ">=18.0.0" },
  volta: { node: "20.19.6" },
  repository: "https://github.com/Flow-Scanner/lightning-flow-scanner-cli.git"
});

writeJSON('turbo.json', {
  "$schema": "https://turbo.build/schema.json",
  pipeline: {
    build: { dependsOn: ["^build"], outputs: ["lib/**", "out/**", "dist/**"] },
    test: { dependsOn: ["build"], cache: true },
    clean: { cache: false }
  }
});

fs.writeFileSync('README.md', `# Lightning Flow Scanner\n\nMonorepo with CLI and Core.\n`);
fs.writeFileSync('.gitignore', 'node_modules/\n*.log\n.DS_Store\n');

run('git add .');
run('git commit -m "Initial monorepo structure"');

// Step 3: Import CLI with full history using subtree
console.log('\n[3/10] Adding CLI repository as remote...');
run('git remote add cli-origin ../lightning-flow-scanner-cli');
run('git fetch cli-origin');

console.log('\n[4/10] Merging CLI repository with full history...');
run('git merge -s ours --no-commit --allow-unrelated-histories cli-origin/main');
run('git read-tree --prefix=packages/cli/ -u cli-origin/main');
run('git commit -m "Import CLI repository with full history into packages/cli"');
run('git remote remove cli-origin');

// Step 4: Import Core with full history using subtree
console.log('\n[5/10] Adding Core repository as remote...');
run('git remote add core-origin ../lightning-flow-scanner-core');
run('git fetch core-origin');

console.log('\n[6/10] Merging Core repository with full history...');
run('git merge -s ours --no-commit --allow-unrelated-histories core-origin/main');
run('git read-tree --prefix=packages/core/ -u core-origin/main');
run('git commit -m "Import Core repository with full history into packages/core"');
run('git remote remove core-origin');

// Step 5: Update package.json files
console.log('\n[7/10] Updating package references...');

// Update CLI to use workspace
const cliPkgPath = 'packages/cli/package.json';
if (fs.existsSync(cliPkgPath)) {
  const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, 'utf-8'));
  if (cliPkg.dependencies && cliPkg.dependencies['@flow-scanner/lightning-flow-scanner-core']) {
    cliPkg.dependencies['@flow-scanner/lightning-flow-scanner-core'] = 'workspace:*';
  }
  cliPkg.repository = {
    type: "git",
    url: "git+https://github.com/Flow-Scanner/lightning-flow-scanner-cli.git",
    directory: "packages/cli"
  };
  writeJSON(cliPkgPath, cliPkg);
  console.log('✓ Updated CLI package.json');
}

// Update Core repo URL
const corePkgPath = 'packages/core/package.json';
if (fs.existsSync(corePkgPath)) {
  const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf-8'));
  corePkg.repository = {
    type: "git",
    url: "git+https://github.com/Flow-Scanner/lightning-flow-scanner-cli.git",
    directory: "packages/core"
  };
  writeJSON(corePkgPath, corePkg);
  console.log('✓ Updated Core package.json');
}

run('git add .');
run('git commit -m "Update package references for monorepo" --allow-empty');

// Step 6: Install dependencies
console.log('\n[8/10] Installing dependencies...');
run('npm install');

// Step 7: Build
console.log('\n[9/10] Building packages...');
run('npm run build', { allowFail: true });

// Step 8: Test
console.log('\n[10/10] Running tests...');
run('npm test', { allowFail: true });

console.log('\n' + '='.repeat(70));
console.log('✅ MONOREPO CREATED WITH FULL HISTORY!');
console.log('='.repeat(70));
console.log('\nVerify history preservation:');
console.log('  git log --oneline --graph --all -30');
console.log('  git log --follow packages/cli/package.json');
console.log('  git log --follow packages/core/package.json');
console.log('\nIf everything looks good, force push:');
console.log('  git remote add origin https://github.com/Flow-Scanner/lightning-flow-scanner-cli.git');
console.log('  git push origin main --force');
console.log('');