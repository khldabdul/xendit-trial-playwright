# Playwright TypeScript Framework

A robust, scalable test automation framework built with Playwright, TypeScript, and Allure reporting. Designed for testing web applications and APIs with comprehensive reporting and CI/CD integration.

## Features

- **Type-Safe Testing**: Built with TypeScript for maximum reliability and autocomplete
- **ESLint 9 Flat Config**: Modern ESLint configuration with Playwright and TypeScript rules
- **Page Object Model**: Clean separation of test logic and page interactions
- **Allure Reporting**: Beautiful, detailed test reports with screenshots, videos, and HAR files
- **Multi-App Architecture**: Test multiple applications from a single framework
- **Environment Configuration**: Type-safe configuration for dev, staging, and production
- **Smart Fixtures**: Pre-loaded fixtures with fully typed client classes
- **Path Aliases**: Clean imports using custom path aliases (`@sauce-demo-fixtures`)
- **HAR Recording**: Built-in network traffic recording and analysis
- **CI/CD Ready**: Can be integrated with GitHub Actions, GitLab CI, etc.
- **Developer Friendly**: Makefile commands, ESLint, Prettier

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps chromium

# Run all working tests
pnpm test

# Generate and open Allure report
make report-allure-open
```

## Test Reports

### Allure Report

After running tests, generate and view the Allure report:

```bash
# Generate report only
make report-allure
# or
pnpm report:allure

# Generate and open report in browser
make report-allure-open
# or
pnpm report:open
```

The report will be available at `allure-report/index.html`.

### Playwright HTML Report

```bash
# Generate and open Playwright HTML report
pnpm exec playwright show-report
```

### Report Files

| Report            | Location                       | Command                            |
| ----------------- | ------------------------------ | ---------------------------------- |
| Allure Report     | `allure-report/index.html`     | `make report-allure-open`          |
| Playwright Report | `playwright-report/index.html` | `pnpm exec playwright show-report` |
| Allure Results    | `allure-results/`              | Auto-generated during tests        |
| Test Results      | `test-results/`                | Auto-generated during tests        |

## Project Structure

```
playwright-typescript-framework/
├── apps/                      # Application-specific tests
│   ├── e2e/                   # End-to-end tests
│   │   └── xendit/            # ✅ Working - Xendit E2E tests
│   └── api/                   # API tests
│       └── xendit/            # ✅ Working - Xendit API tests
├── src/                       # Framework source code
│   ├── config/                # Configuration files
│   ├── decorators/            # Test decorators
│   ├── fixtures/              # Base fixtures
│   ├── hooks/                 # Test hooks
│   ├── pages/                 # Base page object
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── docs/                      # Documentation
│   ├── SETUP.md               # Setup instructions
│   ├── TESTING.md             # Testing guidelines
│   └── DECORATORS.md          # Allure metadata decorators
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.js           # ESLint 9 flat config
└── package.json               # Dependencies and scripts
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run E2E Tests Only

```bash
# Xendit
pnpm test --project=e2e-xendit
```

### Run API Tests Only

```bash
# All API tests
pnpm test:api

# Xendit API tests
pnpm test --project=api-xendit
```

### Run Specific Test File

```bash
# E2E test
pnpm test apps/e2e/xendit/tests/payment_links.spec.ts

# API test
pnpm test apps/api/xendit/tests/invoices.spec.ts
```

### List All Available Projects

```bash
pnpm test --list
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

### Debug Tests

```bash
# Run in headed mode
HEADED=true pnpm test

# Run with Playwright Inspector
pnpm test --debug

# Run specific test with debug
pnpm test --debug apps/e2e/xendit/tests/payment_links.spec.ts
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Test Environment (default: dev)
TEST_ENV=dev

# Browser Configuration
BROWSER=chromium
HEADLESS=true

# API Keys (optional - for API tests that need them)
OMDB_API_KEY=your-api-key-here
```

## Writing Tests

### E2E Test Example

```typescript
// apps/e2e/xendit/tests/payment_links.spec.ts
import { xenditSmokeTest as test } from '@xendit-fixtures';
import { expect } from '@playwright/test';

test('successfully navigates to payment links', async ({ pages }) => {
  await pages.dashboard.goto();
  await pages.dashboard.navigateToPaymentLinks();
  await expect(pages.paymentLinks.headerTitle).toBeVisible();
});
```

### API Test Example

```typescript
// apps/api/xendit/tests/invoices.spec.ts
import { xenditApiTest as test } from '@xendit-api-fixtures';
import { expect } from '@playwright/test';

test('creates a new invoice', async ({ clients }) => {
  const payload = { external_id: `inv-${Date.now()}`, amount: 75000 };
  const response = await clients.xendit.createInvoice(payload);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('PENDING');
});
```

> **Important**: All API client methods return Promises. Always use `await` for client method calls.

## Available Commands

### Using pnpm

```bash
pnpm test              # Run all tests
pnpm test:e2e          # Run E2E tests only
pnpm test:api          # Run API tests only
pnpm type-check        # Run TypeScript type check
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix ESLint issues automatically
pnpm format            # Format code with Prettier
pnpm report:allure     # Generate Allure report
pnpm report:open       # Generate and open Allure report in browser
```

### Using Make

```bash
make help              # Show all available commands
make setup             # Initial setup
make test              # Run all tests
make test-xendit       # Run Xendit tests
make test-api          # Run all API tests
make report-allure     # Generate Allure report
make report-allure-open # Generate and open Allure report in browser
make check             # Run all checks (type-check, lint)
make clean             # Clean all generated files
```

## Configuration Files

- `eslint.config.js` - ESLint 9 flat config with Playwright and TypeScript rules
- `src/config/environments.ts` - Environment-specific settings (timeouts, artifacts, etc.)
- `src/config/test-data.ts` - Shared test data
- `src/config/apps/*.ts` - Application-specific configuration
- `playwright.config.ts` - Playwright test runner configuration
- `tsconfig.json` - TypeScript compiler options with path aliases and `skipLibCheck`

## Documentation

- [SETUP.md](docs/SETUP.md) - Detailed setup instructions
- [TESTING.md](docs/TESTING.md) - Testing guidelines and best practices
- [DECORATORS.md](docs/DECORATORS.md) - Allure metadata decorators

## License

MIT
