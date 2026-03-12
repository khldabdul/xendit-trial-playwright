import report from 'multiple-cucumber-html-reporter';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { release, hostname } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonDir = 'cucumber-report';
const htmlDir = 'cucumber-report/html-report';

// Check if the JSON file exists, Cucumber might not generate it if tests crash very early
if (!existsSync(`${jsonDir}/cucumber-report.json`)) {
  console.log('No cucumber-report.json found. Skipping HTML report generation.');
  process.exit(0);
}

/**
 * Strip ANSI escape codes from strings in the cucumber report.
 * These codes appear as [2m, [31m, etc. in HTML reports and make them unreadable.
 */
function stripAnsiCodes(str) {
  if (typeof str !== 'string') return str;
  // Match ANSI escape sequences: ESC [ followed by parameters and a letter
  return (
    str
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?m/g, '')
  );
}

/**
 * Recursively clean all strings in an object by stripping ANSI codes.
 */
function cleanObject(obj) {
  if (typeof obj === 'string') {
    return stripAnsiCodes(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// Read and clean the cucumber report JSON
const reportPath = `${jsonDir}/cucumber-report.json`;
try {
  const rawReport = readFileSync(reportPath, 'utf-8');
  const reportData = JSON.parse(rawReport);
  const cleanedReport = cleanObject(reportData);
  writeFileSync(reportPath, JSON.stringify(cleanedReport, null, 2));
  console.log('Cleaned ANSI codes from cucumber report.');
} catch (err) {
  console.warn('Warning: Could not clean cucumber report:', err.message);
}

// Read package.json for dynamic project info
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Extract dependency versions
const getCucumberVersion = () => {
  const version = packageJson.devDependencies?.['@cucumber/cucumber'] || 'unknown';
  return version.replace('^', '').replace('~', '');
};

const getPlaywrightVersion = () => {
  const version = packageJson.devDependencies?.['@playwright/test'] || 'unknown';
  return version.replace('^', '').replace('~', '');
};

// Detect platform name
const getPlatformName = () => {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'osx';
    case 'linux':
      return 'linux';
    default:
      return process.platform;
  }
};

// Get browser info from environment or defaults
const getBrowserInfo = () => {
  const name = process.env.BROWSER || 'chromium';
  // Map common browser names
  const browserMap = {
    chromium: 'chrome',
    chrome: 'chrome',
    firefox: 'firefox',
    webkit: 'webkit',
    safari: 'webkit',
  };
  return {
    name: browserMap[name.toLowerCase()] || name,
    version: process.env.BROWSER_VERSION || 'latest',
  };
};

// Get test environment
const getTestEnv = () => {
  return process.env.TEST_ENV || 'dev';
};

// Get execution mode
const getExecutionMode = () => {
  const headed = process.env.HEADED === 'true';
  const ci = process.env.CI === 'true';
  if (ci) return 'CI (headless)';
  return headed ? 'Headed' : 'Headless';
};

// Build custom data
const buildCustomData = () => {
  const data = [
    { label: 'Project', value: `${packageJson.name} v${packageJson.version}` },
    { label: 'Description', value: packageJson.description },
    { label: 'Environment', value: getTestEnv().toUpperCase() },
    { label: 'Execution Mode', value: getExecutionMode() },
    {
      label: 'Framework',
      value: `Cucumber ${getCucumberVersion()} + Playwright ${getPlaywrightVersion()}`,
    },
    { label: 'Node.js', value: process.version },
    { label: 'Execution Time', value: new Date().toLocaleString() },
  ];

  // Add CI info if available
  if (process.env.CI) {
    data.push({ label: 'CI', value: 'Yes' });
    if (process.env.GITHUB_SHA) {
      data.push({ label: 'Commit', value: process.env.GITHUB_SHA.substring(0, 7) });
    }
    if (process.env.GITHUB_REF_NAME) {
      data.push({ label: 'Branch', value: process.env.GITHUB_REF_NAME });
    }
  }

  return data;
};

report.generate({
  jsonDir: jsonDir,
  reportPath: htmlDir,
  // Metadata for the report
  metadata: {
    browser: getBrowserInfo(),
    device: hostname(),
    platform: {
      name: getPlatformName(),
      version: release(),
    },
  },
  // Custom data displayed in the report
  customData: {
    title: 'Test Run Info',
    data: buildCustomData(),
  },
  // Report branding
  reportName: `${packageJson.name} - BDD Test Report`,
  // Display screenshots and videos in the report
  displayDuration: true,
  displayScenarioTimeByStep: true,
  // Page title in browser tab
  pageTitle: `${packageJson.name} - BDD Report`,
  // Embed screenshots and videos inline in the report
  embedScreenshots: true,
  // Launch report in browser after generation (optional)
  openReportInBrowser: false,
});

console.log(`\n✅ BDD Report generated at ${htmlDir}/index.html\n`);
