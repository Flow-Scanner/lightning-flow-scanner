// add-vsx-to-monorepo.js
// Run this in your existing monorepo to add the VSCode extension package
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
console.log('ADDING VSCODE EXTENSION TO MONOREPO');
console.log('='.repeat(70));

// Step 1: Import vsx repo with history
console.log('\n[1/5] Adding VSX repository as remote...');
run('git remote add vsx-origin ../lightning-flow-scanner-vsx');
run('git fetch vsx-origin');

console.log('\n[2/5] Merging VSX repository with full history...');
run('git merge -s ours --no-commit --allow-unrelated-histories vsx-origin/main');
run('git read-tree --prefix=packages/vsx/ -u vsx-origin/main');
run('git commit -m "Import VSX repository with full history into packages/vsx"');
run('git remote remove vsx-origin');

// Step 2: Update vsx package.json
console.log('\n[3/5] Updating VSX package.json...');
const vsxPkgPath = 'packages/vsx/package.json';
if (fs.existsSync(vsxPkgPath)) {
  const vsxPkg = JSON.parse(fs.readFileSync(vsxPkgPath, 'utf-8'));
  
  // Update to use workspace dependency
  if (vsxPkg.dependencies && vsxPkg.dependencies['@flow-scanner/lightning-flow-scanner-core']) {
    vsxPkg.dependencies['@flow-scanner/lightning-flow-scanner-core'] = 'workspace:*';
  }
  
  // Update repository
  vsxPkg.repository = {
    type: "git",
    url: "git+https://github.com/Flow-Scanner/lightning-flow-scanner.git",
    directory: "packages/vsx"
  };
  
  writeJSON(vsxPkgPath, vsxPkg);
  console.log('✓ Updated VSX package.json');
}

// Step 3: Update .gitignore to allow vsx dist/
console.log('\n[4/5] Updating .gitignore...');
let gitignore = '';
if (fs.existsSync('.gitignore')) {
  gitignore = fs.readFileSync('.gitignore', 'utf8');
}

if (!gitignore.includes('!packages/vsx/dist/')) {
  gitignore += '\n# Allow VSCode extension dist (required for extension)\n!packages/vsx/dist/\n';
  fs.writeFileSync('.gitignore', gitignore);
  console.log('✓ Updated .gitignore to allow vsx dist/');
}

// Step 4: Update root package.json scripts
console.log('\n[5/5] Updating root package.json scripts...');
const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
rootPkg.scripts = {
  ...rootPkg.scripts,
  'build:vsx': 'pnpm --filter=lightning-flow-scanner-vsx run build',
  'build:vsx:package': 'pnpm --filter=lightning-flow-scanner-vsx run build:vsx',
  'watch:vsx': 'pnpm --filter=lightning-flow-scanner-vsx run watch'
};
writeJSON('package.json', rootPkg);

run('git add .');
run('git commit -m "Add VSCode extension package to monorepo"');

console.log('\n' + '='.repeat(70));
console.log('✅ VSCODE EXTENSION ADDED TO MONOREPO!');
console.log('='.repeat(70));
console.log('\nNext steps:');
console.log('  1. Build core: pnpm build:core');
console.log('  2. Build VSX: pnpm build:vsx');
console.log('  3. Commit dist/: git add packages/vsx/dist && git commit -m "build: vsx dist"');
console.log('  4. Package extension: pnpm build:vsx:package');
console.log('\nThe .vsix file will be in packages/vsx/');
console.log('Users can install it from VS Code Marketplace or manually.');
console.log('');