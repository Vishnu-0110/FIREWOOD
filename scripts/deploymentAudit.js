#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const isStrict = process.argv.includes('--strict');
const requireLiveChecks = process.argv.includes('--require-live');

const report = {
  timestamp: new Date().toISOString(),
  strict: isStrict,
  requireLiveChecks,
  passed: [],
  warnings: [],
  failed: []
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const addPassed = (title, detail) => report.passed.push({ title, detail });
const addWarning = (title, detail) => report.warnings.push({ title, detail });
const addFailed = (title, detail) => report.failed.push({ title, detail });

const printSection = (label, items) => {
  if (items.length === 0) return;
  console.log(`\n${label}`);
  items.forEach((item) => {
    console.log(`- ${item.title}`);
    if (item.detail) {
      console.log(`  ${item.detail}`);
    }
  });
};

const readFileIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
};

const runCommand = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  const combinedOutput = [result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n')
    .trim();

  const errorDetail = result.error ? result.error.message : '';
  const statusDetail = result.status !== null ? `exit code ${result.status}` : '';
  const signalDetail = result.signal ? `signal ${result.signal}` : '';
  const meta = [errorDetail, statusDetail, signalDetail].filter(Boolean).join(' | ');

  return {
    ok: result.status === 0,
    output: [combinedOutput, meta].filter(Boolean).join('\n')
  };
};

const normalizeOrigin = (value) => value.replace(/\/+$/, '');

const hasSpaRedirectInToml = (content) => {
  const blocks = content.match(/\[\[redirects\]\][\s\S]*?(?=\n\[\[|\n\[|$)/gim) || [];
  return blocks.some((block) => (
    /from\s*=\s*["']\/\*["']/i.test(block)
    && /to\s*=\s*["']\/index\.html["']/i.test(block)
    && /status\s*=\s*200/i.test(block)
  ));
};

const hasSpaRedirectInRedirectsFile = (content) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return lines.some((line) => /^\/\*\s+\/index\.html\s+200(?:\s*!?)?$/i.test(line));
};

const parseJsonIfPossible = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const isCatchAllRule = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  return normalized === '/(.*)' || normalized === '/:path*' || normalized === '/*' || normalized === '/(.*)*';
};

const isSpaDestination = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  return normalized === '/' || normalized === '/index.html';
};

const hasVercelSpaFallback = (content) => {
  const parsed = parseJsonIfPossible(content);
  if (!parsed || typeof parsed !== 'object') return false;

  const rewrites = Array.isArray(parsed.rewrites) ? parsed.rewrites : [];
  const rewriteMatches = rewrites.some((rule) => (
    rule
    && isCatchAllRule(rule.source)
    && isSpaDestination(rule.destination)
  ));

  if (rewriteMatches) return true;

  const routes = Array.isArray(parsed.routes) ? parsed.routes : [];
  return routes.some((rule) => (
    rule
    && typeof rule.src === 'string'
    && /^\/\.\*/.test(rule.src.replace(/\s/g, ''))
    && isSpaDestination(rule.dest)
  ));
};

const normalizeBaseUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
};

const fetchWithTimeout = async (url, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
};

const writeReport = () => {
  const reportDir = path.join(rootDir, 'reports');
  const reportPath = path.join(reportDir, 'deployment-audit-report.json');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return reportPath;
};

const runStaticChecks = () => {
  const npmExecPath = process.env.npm_execpath;
  const baseline = npmExecPath
    ? runCommand(process.execPath, [npmExecPath, 'run', 'deploy:check'], rootDir)
    : runCommand(npmCommand, ['run', 'deploy:check'], rootDir);
  if (baseline.ok) {
    addPassed('Baseline deploy check passed', 'Executed `npm run deploy:check` successfully.');
  } else {
    addFailed('Baseline deploy check failed', baseline.output || 'No output captured.');
  }

  const vercelCandidates = [
    path.join(rootDir, 'vercel.json'),
    path.join(rootDir, 'client', 'vercel.json')
  ];
  let vercelFallbackLocation = '';
  for (const candidate of vercelCandidates) {
    const content = readFileIfExists(candidate);
    if (!content) continue;
    if (hasVercelSpaFallback(content)) {
      vercelFallbackLocation = path.relative(rootDir, candidate);
      break;
    }
  }

  const netlifyCandidates = [
    path.join(rootDir, 'netlify.toml'),
    path.join(rootDir, 'client', 'netlify.toml'),
    path.join(rootDir, '_redirects'),
    path.join(rootDir, 'client', 'public', '_redirects')
  ];
  let netlifyFallbackLocation = '';
  for (const candidate of netlifyCandidates) {
    const content = readFileIfExists(candidate);
    if (!content) continue;
    if (candidate.endsWith('.toml') && hasSpaRedirectInToml(content)) {
      netlifyFallbackLocation = path.relative(rootDir, candidate);
      break;
    }
    if (candidate.endsWith('_redirects') && hasSpaRedirectInRedirectsFile(content)) {
      netlifyFallbackLocation = path.relative(rootDir, candidate);
      break;
    }
  }

  if (vercelFallbackLocation) {
    addPassed('Vercel SPA fallback is configured', `Detected at ${vercelFallbackLocation}.`);
  } else if (netlifyFallbackLocation) {
    addPassed('SPA fallback is configured (Netlify format)', `Detected at ${netlifyFallbackLocation}.`);
    addWarning(
      'Vercel fallback file not found',
      'You are likely relying on Netlify-style config. Add `client/vercel.json` rewrites when using Vercel.'
    );
  } else {
    addFailed(
      'SPA fallback is missing',
      'Add Vercel rewrite `/(.*) -> /` in `client/vercel.json` or Netlify fallback `/* /index.html 200`.'
    );
  }

  const renderYamlPath = path.join(rootDir, 'render.yaml');
  const renderContent = readFileIfExists(renderYamlPath);
  if (renderContent) {
    addPassed('Render blueprint is present', 'Found `render.yaml`.');

    if (/rootDir:\s*server\b/.test(renderContent)) {
      addPassed('Render root directory is set', '`render.yaml` points to `server` rootDir.');
    } else {
      addWarning('Render root directory check', 'Expected `rootDir: server` in `render.yaml`.');
    }

    if (/healthCheckPath:\s*\/health\b/.test(renderContent)) {
      addPassed('Render health check path is configured', '`healthCheckPath: /health` is set.');
    } else {
      addWarning('Render health check path check', 'Set `healthCheckPath: /health` in `render.yaml`.');
    }

    if (/buildCommand:\s*.*deploy:check/.test(renderContent)) {
      addPassed('Render build command includes deploy checks', '`buildCommand` runs `deploy:check`.');
    } else {
      addWarning('Render build command check', 'Include `npm run deploy:check` in `render.yaml` buildCommand.');
    }
  } else {
    addWarning(
      'Render blueprint not found',
      'No `render.yaml` detected. This is fine if you configured Render manually.'
    );
  }

  const clientEnvExample = readFileIfExists(path.join(rootDir, 'client', '.env.example'));
  if (clientEnvExample && /(^|\n)VITE_API_URL=.+/m.test(clientEnvExample)) {
    addPassed('Frontend API variable documented', '`client/.env.example` includes `VITE_API_URL`.');
  } else {
    addWarning(
      'Frontend API variable not clearly documented',
      'Add `VITE_API_URL` to `client/.env.example` so deployment setup is explicit.'
    );
  }

  const localClientEnv = readFileIfExists(path.join(rootDir, 'client', '.env'));
  if (localClientEnv && /(^|\n)VITE_API_URL=.*localhost/m.test(localClientEnv)) {
    addWarning(
      'Local frontend env points to localhost',
      'For Vercel production, configure `VITE_API_URL` in Vercel environment variables.'
    );
  }
};

const runRuntimeChecks = async () => {
  const frontendUrlRaw = process.env.AUDIT_FRONTEND_URL;
  const apiUrlRaw = process.env.AUDIT_API_URL;

  const frontendBase = frontendUrlRaw ? normalizeBaseUrl(frontendUrlRaw) : null;
  const apiBase = apiUrlRaw ? normalizeBaseUrl(apiUrlRaw) : null;

  if (frontendBase) {
    try {
      const frontendUrl = new URL(frontendBase);
      const homeResponse = await fetchWithTimeout(frontendBase);
      if (homeResponse.ok) {
        addPassed('Frontend URL is reachable', `${frontendBase} responded with ${homeResponse.status}.`);
      } else {
        addFailed('Frontend URL is not healthy', `${frontendBase} responded with ${homeResponse.status}.`);
      }

      if (frontendUrl.hostname.endsWith('vercel.app')) {
        addPassed('Frontend host looks like Vercel', `${frontendUrl.hostname}`);
      }

      const deepRouteUrl = `${frontendBase}/__deployment_audit_route__`;
      const deepRouteResponse = await fetchWithTimeout(deepRouteUrl);
      const contentType = deepRouteResponse.headers.get('content-type') || '';

      if (deepRouteResponse.status === 200 && /text\/html/i.test(contentType)) {
        addPassed('Frontend deep-link fallback works', `${deepRouteUrl} returned HTML.`);
      } else {
        addFailed(
          'Frontend deep-link fallback failed',
          `${deepRouteUrl} returned ${deepRouteResponse.status} (${contentType || 'no content-type'}).`
        );
      }
    } catch (error) {
      addFailed('Frontend runtime audit failed', `${frontendBase}: ${error.message}`);
    }
  } else {
    if (requireLiveChecks) {
      addFailed(
        'Frontend runtime audit requires URL',
        'Set `AUDIT_FRONTEND_URL=https://<your-vercel-project>.vercel.app`.'
      );
    } else {
      addWarning(
        'Frontend runtime audit skipped',
        'Set `AUDIT_FRONTEND_URL` to verify deployed Vercel behavior.'
      );
    }
  }

  if (apiBase) {
    try {
      const apiUrl = new URL(apiBase);
      const endpoints = ['/health', '/ready', '/api/health'];

      for (const endpoint of endpoints) {
        const url = `${apiBase}${endpoint}`;
        const response = await fetchWithTimeout(url);
        if (response.ok) {
          addPassed('API endpoint reachable', `${url} responded with ${response.status}.`);
        } else {
          addFailed('API endpoint check failed', `${url} responded with ${response.status}.`);
        }
      }

      if (apiUrl.hostname.endsWith('onrender.com')) {
        addPassed('API host looks like Render', `${apiUrl.hostname}`);
      }
    } catch (error) {
      addFailed('API runtime audit failed', `${apiBase}: ${error.message}`);
    }
  } else {
    if (requireLiveChecks) {
      addFailed(
        'API runtime audit requires URL',
        'Set `AUDIT_API_URL=https://<your-render-service>.onrender.com`.'
      );
    } else {
      addWarning(
        'API runtime audit skipped',
        'Set `AUDIT_API_URL` to verify backend health endpoints.'
      );
    }
  }

  if (frontendBase && process.env.CORS_ORIGIN) {
    try {
      const frontendOrigin = normalizeOrigin(new URL(frontendBase).origin);
      const configuredOrigins = process.env.CORS_ORIGIN
        .split(',')
        .map((origin) => normalizeOrigin(origin.trim()))
        .filter(Boolean);

      if (configuredOrigins.includes(frontendOrigin)) {
        addPassed('CORS includes frontend origin', `${frontendOrigin} is present in CORS_ORIGIN.`);
      } else {
        addWarning(
          'CORS may not allow deployed frontend',
          `${frontendOrigin} is not present in CORS_ORIGIN.`
        );
      }
    } catch (error) {
      addWarning('CORS audit skipped', `Unable to parse CORS_ORIGIN: ${error.message}`);
    }
  }
};

const main = async () => {
  runStaticChecks();
  await runRuntimeChecks();

  printSection('PASS', report.passed);
  printSection('WARN', report.warnings);
  printSection('FAIL', report.failed);

  const reportPath = writeReport();
  console.log(`\nReport written to ${path.relative(rootDir, reportPath)}`);

  const shouldFail = report.failed.length > 0 || (isStrict && report.warnings.length > 0);
  if (shouldFail) {
    if (isStrict && report.failed.length === 0 && report.warnings.length > 0) {
      console.error('\nDeployment audit failed in strict mode because warnings are present.');
    } else {
      console.error('\nDeployment audit failed.');
    }
    process.exit(1);
  }

  console.log('\nDeployment audit passed.');
};

void main().catch((error) => {
  console.error('Deployment audit crashed:', error);
  process.exit(1);
});
