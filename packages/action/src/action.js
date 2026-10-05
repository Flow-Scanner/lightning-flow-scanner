const core = require("@actions/core");
const github = require("@actions/github");
const lfs_core = require("@flow-scanner/lightning-flow-scanner-core");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { cosmiconfig } = require("cosmiconfig");
const { minimatch } = require("minimatch");
const { exportSarif } = lfs_core;

async function loadScannerOptions() {
  const configPath = core.getInput("config");
  const moduleName = "flow-scanner";
  const searchPlaces = [
    "package.json",
    `.${moduleName}.yaml`,
    `.${moduleName}.yml`,
    `.${moduleName}.json`,
    `config/.${moduleName}.yaml`,
    `config/.${moduleName}.yml`,
    ".flow-scanner"
  ];
  const explorer = cosmiconfig(moduleName, {
    searchPlaces,
    stopDir: os.homedir()
  });

  if (configPath) {
    // Resolve path relative to GITHUB_WORKSPACE
    const resolvedPath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.env.GITHUB_WORKSPACE || process.cwd(), configPath);
    core.info(`Using config file from input: ${resolvedPath}`);
    try {
      const result = await explorer.load(resolvedPath);
      if (result && !result.isEmpty) {
        return result.config;
      }
      throw new Error("Config file is empty");
    } catch (error) {
      throw new Error(`Failed to load config from ${resolvedPath}: ${error.message}`);
    }
  }

  const result = await explorer.search();
  if (result && !result.isEmpty) {
    core.info(`Found config file: ${result.filepath}`);
    return result.config;
  }
  core.info("No config file found. Using default scanner behavior.");
  return {};
}


function getThreshold(config) {
  const validThresholds = ["error", "warning", "note", "never"];
  const thresholdInput = core.getInput("threshold");

  if (thresholdInput && validThresholds.includes(thresholdInput)) {
    core.info(`Using threshold from workflow input: ${thresholdInput}`);
    return thresholdInput;
  }

  if (config?.threshold && validThresholds.includes(config.threshold)) {
    core.info(`Using threshold from config file: ${config.threshold}`);
    return config.threshold;
  }

  return "never"; // Default: no filtering
}

function getBetaMode(config) {
  const betaModeInput = core.getInput("betaMode");
  if (betaModeInput && betaModeInput.toLowerCase() === "true") {
    core.info("Beta mode enabled from workflow input");
    return true;
  }
  if (config?.betaMode === true) {
    core.info("Beta mode enabled from config file");
    return true;
  }
  return false;
}

function getCategories(config) {
  const validCategories = ["problem", "suggestion", "layout"];
  const categoriesInput = core.getInput("categories");

  if (categoriesInput) {
    // Parse comma-separated or space-separated input
    const parsed = categoriesInput.split(/[,\s]+/).map(c => c.trim().toLowerCase()).filter(c => validCategories.includes(c));
    if (parsed.length > 0) {
      core.info(`Using categories from workflow input: ${parsed.join(", ")}`);
      return parsed;
    }
  }

  if (config?.categories && Array.isArray(config.categories)) {
    const filtered = config.categories.filter(c => validCategories.includes(c));
    if (filtered.length > 0) {
      core.info(`Using categories from config file: ${filtered.join(", ")}`);
      return filtered;
    }
  }

  return undefined; // No filter - all categories
}

function getSarifOnly() {
  const sarifOnlyInput = core.getInput("sarif-only");
  return sarifOnlyInput && sarifOnlyInput.toLowerCase() === "true";
}

function applyIgnorePatterns(files, ignorePatterns) {
  if (!ignorePatterns || ignorePatterns.length === 0) {
    return files;
  }

  core.info(`Applying ${ignorePatterns.length} ignore pattern(s): ${ignorePatterns.join(", ")}`);

  const filtered = files.filter(file => {
    // Normalize path separators to forward slashes for consistent matching
    const normalizedFile = file.replace(/\\/g, "/");

    // Check if file matches any ignore pattern
    for (const pattern of ignorePatterns) {
      if (minimatch(normalizedFile, pattern)) {
        core.debug(`Ignoring file: ${file} (matched pattern: ${pattern})`);
        return false;
      }
    }
    return true;
  });

  const ignoredCount = files.length - filtered.length;
  if (ignoredCount > 0) {
    core.info(`Ignored ${ignoredCount} file(s) based on ignore patterns`);
  }

  return filtered;
}


async function getDefaultBranch(octokit, repo) {
  try {
    const { data: repoData } = await octokit.rest.repos.get({
      owner: repo.owner,
      repo: repo.repo
    });
    return repoData.default_branch;
  } catch (error) {
    core.warning(`Failed to get default branch: ${error.message}. Falling back to 'main'`);
    return "main";
  }
}

async function run() {
  const inputToken = core.getInput("GITHUB_TOKEN", { required: false });
  const token = inputToken || process.env.GITHUB_TOKEN || github.context.token;

  if (!token) {
    core.setFailed("No GitHub token available. Provide GITHUB_TOKEN input or run in a GitHub Actions context.");
    return;
  }

  const octokit = github.getOctokit(token);
  const { context } = github;
  const repo = context.repo;

  try {
    let files = [];
    let head_sha;
    let branchName;

    // Determine commit SHA and branch based on event type
    if (context.eventName === "pull_request" || context.eventName === "pull_request_target") {
      head_sha = context.payload.pull_request.head.sha;
      branchName = context.payload.pull_request.head.ref;
      core.info(`Scanning pull request #${context.payload.pull_request.number} (branch: ${branchName})`);
    } else if (context.eventName === "push") {
      head_sha = context.sha;
      branchName = context.ref.replace("refs/heads/", "");
      core.info(`Scanning push to branch: ${branchName}`);
    } else if (context.eventName === "workflow_dispatch" || context.eventName === "schedule") {
      const branchInput = core.getInput("branch");
      branchName = branchInput || context.ref.replace("refs/heads/", "");
      
      if (!branchName || branchName === context.ref) {
        branchName = await getDefaultBranch(octokit, repo);
      }
      
      const { data: branchData } = await octokit.rest.repos.getBranch({
        owner: repo.owner,
        repo: repo.repo,
        branch: branchName
      });
      head_sha = branchData.commit.sha;
      core.info(`Scanning branch: ${branchName}`);
    } else {
      head_sha = context.sha;
      branchName = await getDefaultBranch(octokit, repo);
      core.info(`Event type: ${context.eventName}. Scanning default branch: ${branchName}`);
    }

    // Get list of flow files based on event type
    if (context.eventName === "pull_request" || context.eventName === "pull_request_target") {
      const pull_number = context.payload.pull_request.number;
      const { data: prFiles } = await octokit.rest.pulls.listFiles({
        owner: repo.owner,
        repo: repo.repo,
        pull_number
      });
      files = prFiles
        .map(file => file.filename)
        .filter(file => file.endsWith("flow-meta.xml") || file.endsWith(".flow"));
      core.info(`Found ${files.length} flow files in PR changes`);
    } else {
      const { data: tree } = await octokit.rest.git.getTree({
        owner: repo.owner,
        repo: repo.repo,
        tree_sha: head_sha,
        recursive: true
      });
      files = tree.tree
        .filter(
          item =>
            item.type === "blob" &&
            (item.path.endsWith("flow-meta.xml") || item.path.endsWith(".flow"))
        )
        .map(item => item.path);
      core.info(`Found ${files.length} flow files in repository`);
    }

    // Load configuration
    const fileConfig = await loadScannerOptions();

    // Apply ignore patterns to filter files
    if (fileConfig.ignore && Array.isArray(fileConfig.ignore)) {
      files = applyIgnorePatterns(files, fileConfig.ignore);
      core.info(`After applying ignore patterns: ${files.length} flow files to scan`);
    }
    const betaMode = getBetaMode(fileConfig);
    const categories = getCategories(fileConfig);
    const threshold = getThreshold(fileConfig);
    const sarifOnly = getSarifOnly();

    const config = {
      ...fileConfig,
      betaMode: betaMode,
      categories: categories,
      threshold: threshold,
      rules: fileConfig.rules || {}
    };

    if (categories) {
      core.info(`Filtering rules by categories: ${categories.join(", ")}`);
    }

    // Parse flows
    let pFlows = [];
    for (const file of files) {
      pFlows.push(...(await lfs_core.parse([file])));
    }

    // Apply ignoreFlows filter (filter by flow API name)
    if (fileConfig.ignoreFlows && Array.isArray(fileConfig.ignoreFlows) && fileConfig.ignoreFlows.length > 0) {
      core.info(`Applying ignoreFlows filter for ${fileConfig.ignoreFlows.length} flow name(s): ${fileConfig.ignoreFlows.join(", ")}`);
      const originalCount = pFlows.length;
      pFlows = pFlows.filter(pFlow => {
        if (pFlow.flow && pFlow.flow.name) {
          const shouldIgnore = fileConfig.ignoreFlows.includes(pFlow.flow.name);
          if (shouldIgnore) {
            core.debug(`Ignoring flow by name: ${pFlow.flow.name}`);
          }
          return !shouldIgnore;
        }
        return true;
      });
      const ignoredCount = originalCount - pFlows.length;
      if (ignoredCount > 0) {
        core.info(`Ignored ${ignoredCount} flow(s) by API name`);
      }
    }

    if (pFlows.length === 0) {
      core.info("No flows to scan.");
    } else {
      core.info(`Scanning ${pFlows.length} Flow(s)...`);
    }

    // Build a subflow resolver over all parsed flows so cross-flow rules can
    // analyze referenced subflows (DML-in-loop through subflows, unresolved
    // subflows, user data passed into a without-sharing subflow, ...).
    const subflowResolver = new lfs_core.PreloadedResolver();
    for (const pFlow of pFlows) {
      if (pFlow.flow && pFlow.flow.name) {
        subflowResolver.addFlow(pFlow.flow.name, pFlow.flow);
      }
    }
    const scanConfig = Object.assign({}, config, { subflowResolver });

    // Scan flows
    let scanResults = [];
    for (const flow of pFlows) {
      const res = lfs_core.scan([flow], scanConfig);
      scanResults.push(...res);
    }

    // Build structured results (always, even if sarif-only)
    const results = [];
    const severityCounts = { error: 0, warning: 0, note: 0 };
    
    for (const scanResult of scanResults) {
      if (scanResult.ruleResults.length > 0) {
        for (const ruleResult of scanResult.ruleResults) {
          if (ruleResult.occurs && Array.isArray(ruleResult.details)) {
            for (const detail of ruleResult.details) {
              const severity =
                config.rules?.[ruleResult.ruleId]?.severity ||
                config.rules?.[ruleResult.ruleName]?.severity ||
                ruleResult.severity ||
                "warning";
              
              severityCounts[severity] = (severityCounts[severity] || 0) + 1;
              
              results.push({
                flow: scanResult.flow.name,
                flowLabel: scanResult.flow.label,
                flowPath: scanResult.flow.fsPath,
                ruleId: ruleResult.ruleId,
                ruleName: ruleResult.ruleName,
                severity: severity,
                message: ruleResult.message || ruleResult.ruleDefinition.description || "",
                messageUrl: ruleResult.messageUrl || "",
                type: detail.type || "",
                name: detail.name || "",
                line: detail.lineNumber || "",
                column: detail.columnNumber || "",
                metaType: detail.metaType || "",
                dataType: detail.dataType || "",
                expression: detail.expression || ""
              });
            }
          }
        }
      }
    }

    // Core already filters by threshold, so results and scanResults are pre-filtered

    // Generate SARIF
    const sarifPath = path.join(process.env.GITHUB_WORKSPACE || '', 'flow-scanner-results.sarif');
    let sarifOutput;

    if (scanResults.length === 0 || results.length === 0) {
      const emptySarif = {
        version: "2.1.0",
        $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        runs: [{
          tool: {
            driver: {
              name: "Lightning Flow Scanner",
              version: "1.0.0",
              informationUri: "https://github.com/Flow-Scanner/lightning-flow-scanner-action"
            }
          },
          results: []
        }]
      };
      sarifOutput = JSON.stringify(emptySarif, null, 2);
    } else {
      const baseSarif = exportSarif(scanResults);
      const parsed = JSON.parse(baseSarif);
      if (parsed.runs && parsed.runs.length > 1) {
        core.info(`Merging ${parsed.runs.length} SARIF runs into 1`);
        const mergedRun = {
          tool: parsed.runs[0].tool || { driver: { name: "FlowScanner" } },
          results: []
        };
        for (const run of parsed.runs) {
          if (run.results) mergedRun.results.push(...run.results);
          if (!mergedRun.artifacts && run.artifacts) mergedRun.artifacts = run.artifacts;
        }
        parsed.runs = [mergedRun];
      }
      sarifOutput = JSON.stringify(parsed, null, 2);
    }

    fs.writeFileSync(sarifPath, sarifOutput);
    core.setOutput('sarifPath', sarifPath);

    // Build summary (core already filtered by threshold)
    const summary = {
      totalFlows: scanResults.length,
      totalViolations: results.length,
      severityCounts: severityCounts,
      threshold: threshold
    };

    core.setOutput('results', JSON.stringify(results));
    core.setOutput('summary', JSON.stringify(summary));

    // Log summary
    core.info(`\n${'='.repeat(60)}`);
    core.info(`Scan Results Summary`);
    core.info(`${'='.repeat(60)}`);
    core.info(`Flows scanned: ${summary.totalFlows}`);
    core.info(`Total violations: ${summary.totalViolations}${threshold !== 'never' ? ` (threshold: ${threshold})` : ''}`);
    core.info(`  - Errors: ${severityCounts.error}`);
    core.info(`  - Warnings: ${severityCounts.warning}`);
    core.info(`  - Notes: ${severityCounts.note}`);
    core.info(`${'='.repeat(60)}\n`);

    // SARIF-only mode: fail on any violation (strict mode for PRs)
    if (sarifOnly && results.length > 0) {
      core.setFailed(`${results.length} flow issue(s) found. SARIF-only mode fails on any result.`);
    }

  } catch (e) {
    console.error(e);
    core.setFailed(e.message);
  }
}

run();