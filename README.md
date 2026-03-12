# Playwright TypeScript Framework

A robust, scalable test automation framework built with Playwright, TypeScript, and Cucumber BDD. Designed for testing web applications and APIs with comprehensive reporting and CI/CD integration.

## Features

- **BDD Testing**: Cucumber integration for business-readable test scenarios
- **Type-Safe Testing**: Built with TypeScript for maximum reliability and autocomplete
- **ESLint 9 Flat Config**: Modern ESLint configuration with Playwright and TypeScript rules
- **Page Object Model**: Clean separation of test logic and page interactions
- **HTML Reporting**: Beautiful cucumber HTML reports with screenshots and videos
- **Multi-App Architecture**: Test multiple applications from a single framework
- **Environment Configuration**: Type-safe configuration for dev, staging, and production
- **Smart Fixtures**: Pre-loaded fixtures with fully typed client classes
- **Path Aliases**: Clean imports using custom path aliases (`@xendit-fixtures`)
- **CI/CD Ready**: Can be integrated with GitHub Actions, GitLab CI, etc.
- **Developer Friendly**: Makefile commands, ESLint, Prettier

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
make setup

# Run all BDD tests
pnpm test

# Generate HTML report
pnpm report
```

## Project Structure

```
playwright-typescript-framework/
├── apps/                      # Application-specific tests
│   ├── e2e/xendit/            # E2E BDD tests
│   │   ├── features/          # Gherkin feature files
│   │   ├── step-definitions/  # Step definitions
│   │   ├── pages/             # Page objects
│   │   └── fixtures/          # App fixtures
│   └── api/xendit/            # API BDD tests
│       ├── features/          # Gherkin feature files
│       ├── step-definitions/  # Step definitions
│       └── fixtures/          # App fixtures
├── src/                       # Framework source code
│   ├── config/                # Configuration files
│   ├── decorators/            # Test decorators
│   ├── fixtures/              # Base fixtures
│   ├── hooks/                 # Test hooks
│   ├── pages/                 # Base page object
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── cucumber/              # BDD support (World, Hooks)
├── cucumber.js                # Cucumber configuration
├── playwright.config.ts       # Playwright configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.js           # ESLint 9 flat config
└── package.json               # Dependencies and scripts
```

## Running Tests

```bash
# Run all BDD tests
pnpm test

# Run all BDD tests (headed mode - see browser)
pnpm test:headed

# Run E2E tests only
pnpm test:e2e

# Run E2E tests only (headed mode)
pnpm test:e2e:headed

# Run API tests only
pnpm test:api

# Dry run (check step definitions)
pnpm test:dry-run
```

### Run Tests in Specific Environment

```bash
# Development (default)
TEST_ENV=dev pnpm test

# Staging
TEST_ENV=staging pnpm test

# Production
TEST_ENV=production pnpm test
```

### Run Filtered Tests

```bash
# Run specific feature file (recommended)
pnpm test:filter -- apps/e2e/xendit/features/login/login.feature

# Run all features in a directory
pnpm test:filter -- apps/e2e/xendit/features/payment-links/

# Run API tests only
pnpm test:api

# Run E2E tests only
pnpm test:e2e

# Run with retry for failed tests
pnpm test -- --retry 1
```

## Test Reports

```bash
# Generate HTML report from cucumber results
pnpm report

# Report location
# cucumber-report/html-report/index.html
```

### Enhanced Reporting with Screenshots & Videos

The framework automatically captures **screenshots** and **videos** for all test scenarios by default. These are embedded directly in the HTML report for easy debugging and evidence collection.

**Features:**
- Full-page screenshots captured after each test
- Video recording of the entire test execution
- Attachments displayed inline in the HTML report

**Configuration:**

```bash
# Control attachment behavior (default: true)
ATTACH_ON_PASS=true   # Attach on passed + failed tests
ATTACH_ON_PASS=false  # Attach only on failed tests
```

**Report Contents:**
- Test execution timeline with step durations
- Embedded screenshots for visual verification
- Video recordings for detailed analysis
- Metadata (browser, platform, execution time)

## Writing Tests

### Feature File Example

```gherkin
# apps/e2e/xendit/features/login/login.feature
Feature: User Login
  As a user
  I want to log in to the dashboard
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I login with valid credentials
    Then I should see the dashboard
```

### Step Definition Example

```typescript
// apps/e2e/xendit/step-definitions/login/login.steps.ts
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the login page', async ({ page }) => {
  await page.goto('/login');
});

When('I login with valid credentials', async ({ page }) => {
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
});

Then('I should see the dashboard', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Available Commands

### Using pnpm

```bash
pnpm test              # Run all BDD tests
pnpm test:headed       # Run all BDD tests (headed mode)
pnpm test:filter       # Run specific feature file (e.g., pnpm test:filter -- path/to/file.feature)
pnpm test:e2e          # Run E2E tests only
pnpm test:e2e:headed   # Run E2E tests only (headed mode)
pnpm test:api          # Run API tests only
pnpm test:dry-run      # Dry run to check steps
pnpm report            # Generate HTML report
pnpm type-check        # Run TypeScript type check
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix ESLint issues automatically
pnpm format            # Format code with Prettier
```

### Using Make

```bash
make help              # Show all available commands
make setup             # Initial setup
make test              # Run all tests
make test-e2e          # Run E2E tests
make test-api          # Run API tests
make report            # Generate HTML report
make check             # Run all checks (type-check, lint)
make clean             # Clean all generated files
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Test Environment (default: dev)
TEST_ENV=dev

# Parallel workers
WORKERS=1

# Report attachments (default: true)
ATTACH_ON_PASS=true
```

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_ENV` | `dev` | Environment (dev, staging, production) |
| `WORKERS` | `1` | Parallel workers |
| `HEADED` | `false` | Run tests in headed mode |
| `ATTACH_ON_PASS` | `true` | Attach screenshots/videos on passed tests |

## Configuration Files

- `cucumber.js` - Cucumber BDD configuration
- `eslint.config.js` - ESLint 9 flat config with Playwright and TypeScript rules
- `src/config/environments.ts` - Environment-specific settings
- `playwright.config.ts` - Playwright test runner configuration
- `tsconfig.json` - TypeScript compiler options with path aliases

## License

MIT
