
const common = {
  import: [
    'src/cucumber/**/*.ts',
  ],
  format: [
    'progress-bar',
    'json:cucumber-report/cucumber-report.json',
    'html:cucumber-report/cucumber-html-report.html'
  ],
  formatOptions: {
    snippet: true,
  },
  parallel: 1,
  retry: process.env.CI ? 1 : 0,
  ...(process.env.CI ? { retryTagFilter: '@flaky' } : {}),
  worldParameters: {
    env: process.env.TEST_ENV || 'dev',
  },
};

export const e2e = {
  ...common,
  paths: ['apps/e2e/**/*.feature'],
  import: [
    ...common.import,
    'apps/e2e/**/step-definitions/**/*.ts'
  ],
};

export const api = {
  ...common,
  paths: ['apps/api/**/*.feature'],
  import: [
    ...common.import,
    'apps/api/**/step-definitions/**/*.ts'
  ],
};
export default {
  ...common,
  // No default paths - CLI arguments will specify which features to run
  // This allows filtering by file path without merging with default paths
  import: [
    ...common.import,
    'apps/**/step-definitions/**/*.ts'
  ],
};

