// Renders docs/media/core-demo.png: a short core API script and its real output
// against the demo flows. Run with `pnpm build:core-demo` after `pnpm build:core`.
// Needs Google Chrome; set CHROME_PATH if it is not in the default macOS location.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '../..');
const core = require(path.join(root, 'packages/core/out/index.js'));
const demoDir = path.join(root, 'example-flows/force-app/demo');
const outFile = path.join(root, 'docs/media/core-demo.png');
const chrome =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The script shown in the image. Keep it in sync with the scan below.
const code = [
  `<span class="k">import</span> { glob } <span class="k">from</span> <span class="s">"node:fs/promises"</span>;`,
  `<span class="k">import</span> core <span class="k">from</span> <span class="s">"@flow-scanner/lightning-flow-scanner-core"</span>;`,
  ``,
  `<span class="k">const</span> { parse, scan, exportDetails } = core;`,
  `<span class="k">const</span> files = <span class="k">await</span> Array.<span class="f">fromAsync</span>(<span class="f">glob</span>(<span class="s">"force-app/demo/*.flow-meta.xml"</span>));`,
  `<span class="k">const</span> violations = <span class="f">exportDetails</span>(<span class="f">scan</span>(<span class="k">await</span> <span class="f">parse</span>(files)));`,
  ``,
  `<span class="k">for</span> (<span class="k">const</span> v <span class="k">of</span> violations) console.<span class="f">log</span>(v.severity.<span class="f">padEnd</span>(<span class="n">8</span>), v.ruleId.<span class="f">padEnd</span>(<span class="n">34</span>), v.flowName);`,
  `console.<span class="f">log</span>(<span class="s">\`\\n\${</span>violations.length<span class="s">} violations\`</span>);`,
];

(async () => {
  const files = fs.readdirSync(demoDir).filter((f) => f.endsWith('.flow-meta.xml')).sort();
  const violations = core.exportDetails(core.scan(await core.parse(files.map((f) => path.join(demoDir, f)))));

  const rows = violations
    .map(
      (v) =>
        `<div><span class="sev ${v.severity}">${esc(v.severity.padEnd(8))}</span> ` +
        `<span class="rule">${esc(v.ruleId.padEnd(34))}</span> <span class="flow">${esc(v.flowName)}</span></div>`
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#1e1e1e;overflow:hidden}
    body{font:15px/23px Menlo,"SF Mono",Consolas,monospace;color:#d4d4d4}
    .win{width:1440px;height:880px;background:#1e1e1e;overflow:hidden}
    .bar{height:36px;background:#2d2d2d;display:flex;align-items:center;padding:0 14px;gap:8px;position:relative}
    .dot{width:12px;height:12px;border-radius:50%}
    .title{position:absolute;left:0;right:0;text-align:center;color:#9d9d9d;font:12px -apple-system,system-ui,sans-serif}
    pre{margin:0;padding:12px 28px;white-space:pre}
    .code{border-bottom:1px solid #333}
    .k{color:#c586c0}.s{color:#ce9178}.f{color:#dcdcaa}.n{color:#b5cea8}
    .prompt{color:#6a9955}
    .sev.error{color:#f48771}.sev.warning{color:#cca700}.sev.note{color:#75beff}
    .rule{color:#d4d4d4}.flow{color:#8a8a8a}
    .sum{color:#fff;font-weight:bold}
  </style></head><body><div class="win">
    <div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span class="title">scan.mjs</span></div>
    <pre class="code">${code.join('\n')}</pre>
    <pre class="out"><span class="prompt">$ node scan.mjs</span>
${rows}
<span class="sum">${violations.length} violations</span></pre>
  </div></body></html>`;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'core-demo-'));
  const htmlFile = path.join(tmp, 'demo.html');
  fs.writeFileSync(htmlFile, html);

  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
        '--force-device-scale-factor=1',
    '--window-size=1440,880',
    `--screenshot=${outFile}`,
    `file://${htmlFile}`,
  ], { stdio: 'ignore' });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Wrote ${path.relative(root, outFile)} (${violations.length} violations)`);
})();
