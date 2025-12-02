// add-action-to-monorepo.js
// Run this in your existing monorepo to add the action package
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
console.log('ADDING GITHUB ACTION TO MONOREPO');
console.log('='.repeat(70));

// Step 1: Import action repo with history
console.log('\n[1/6] Adding Action repository as remote...');
run('git remote add action-origin ../lightning-flow-scanner-action');
run('git fetch action-origin');

console.log('\n[2/6] Merging Action repository with full history...');
run('git merge -s ours --no-commit --allow-unrelated-histories action-origin/main');
run('git read-tree --prefix=packages/action/ -u action-origin/main');
run('git commit -m "Import Action repository with full history into packages/action"');
run('git remote remove action-origin');

// Step 2: Move action.yml to root (GitHub needs it there)
console.log('\n[3/6] Moving action.yml to monorepo root...');
if (fs.existsSync('packages/action/action.yml')) {
  const actionYml = fs.readFileSync('packages/action/action.yml', 'utf8');
  
  // Update path to point to monorepo location
  const updatedActionYml = actionYml.replace(
    /main:\s*dist\/index\.js/,
    'main: packages/action/dist/index.js'
  );
  
  fs.writeFileSync('action.yml', updatedActionYml);
  run('git add action.yml');
  
  console.log('✓ Created action.yml in root with updated path');
}

// Step 3: Update action package.json
console.log('\n[4/6] Updating action package.json...');
const actionPkgPath = 'packages/action/package.json';
if (fs.existsSync(actionPkgPath)) {
  const actionPkg = JSON.parse(fs.readFileSync(actionPkgPath, 'utf-8'));
  
  // Update to use workspace dependency
  if (actionPkg.dependencies && actionPkg.dependencies['@flow-scanner/lightning-flow-scanner-core']) {
    actionPkg.dependencies['@flow-scanner/lightning-flow-scanner-core'] = 'workspace:*';
  }
  
  // Update repository
  actionPkg.repository = {
    type: "git",
    url: "git+https://github.com/Flow-Scanner/lightning-flow-scanner.git",
    directory: "packages/action"
  };
  
  // Update main path
  actionPkg.main = "dist/index.js";
  
  writeJSON(actionPkgPath, actionPkg);
  console.log('✓ Updated action package.json');
}

// Step 4: Update .gitignore to allow action dist/
console.log('\n[5/6] Updating .gitignore...');
let gitignore = '';
if (fs.existsSync('.gitignore')) {
  gitignore = fs.readFileSync('.gitignore', 'utf8');
}

if (!gitignore.includes('!packages/action/dist/')) {
  gitignore += '\n# Allow GitHub Action dist (required for actions)\n!packages/action/dist/\n';
  fs.writeFileSync('.gitignore', gitignore);
  console.log('✓ Updated .gitignore to allow action dist/');
}

// Step 5: Update turbo.json to exclude action from test pipeline
console.log('\n[6/6] Updating turbo.json...');
const turboConfig = JSON.parse(fs.readFileSync('turbo.json', 'utf-8'));

// Update tasks to exclude action from test
if (turboConfig.tasks) {
  // Turbo v2 uses "tasks"
  turboConfig.tasks.test = {
    ...turboConfig.tasks.test,
    cache: true
  };
} else if (turboConfig.pipeline) {
  // Turbo v1 uses "pipeline"
  turboConfig.pipeline.test = {
    ...turboConfig.pipeline.test,
    cache: true
  };
}

writeJSON('turbo.json', turboConfig);

run('git add .');
run('git commit -m "Add GitHub Action package to monorepo"');

console.log('\n' + '='.repeat(70));
console.log('✅ GITHUB ACTION ADDED TO MONOREPO!');
console.log('='.repeat(70));
console.log('\nNext steps:');
console.log('  1. Build core: pnpm build:core');
console.log('  2. Build action: pnpm build:action');
console.log('  3. Commit dist/ folder: git add packages/action/dist && git commit -m "build: action dist"');
console.log('  4. Push to GitHub');
console.log('\nUsers will reference it as:');
console.log('  uses: Flow-Scanner/lightning-flow-scanner@main');
console.log('');