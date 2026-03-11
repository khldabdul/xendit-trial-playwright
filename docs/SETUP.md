# Setup Guide

This guide will help you set up the Playwright TypeScript Framework on your local machine.

## Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **pnpm** 9.x or higher ([Installation](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/downloads))

### Installing pnpm

```bash
npm install -g pnpm
# or
corepack enable
corepack prepare pnpm@latest --activate
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/playwright-typescript-framework.git
cd playwright-typescript-framework
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Install Playwright Browsers

```bash
# Install Chromium (recommended for most tests)
pnpm exec playwright install --with-deps chromium

# Or install all browsers (chromium, firefox, webkit)
pnpm exec playwright install --with-deps
```

### 4. Environment Variables (Optional)

The framework uses `TEST_ENV` to control which environment's URLs are used.

| Variable       | Default | Description                                               |
| -------------- | ------- | --------------------------------------------------------- |
| `TEST_ENV`     | `dev`   | Environment (dev, staging, production) - case-insensitive |
| `WORKERS`      | `1`     | Parallel workers                                          |
| `OMDB_API_KEY` | -       | Required for OMDB API tests                               |

**Environment Aliases** (case-insensitive):

- `dev`, `development`
- `staging`, `stg`, `stage`
- `production`, `prod`

```bash
# Example: Run tests in staging
TEST_ENV=staging pnpm test
```

### 5. Install Git Hooks (Optional)

```bash
pnpm exec husky install
```

## Verification

```bash
pnpm type-check    # Check TypeScript types
pnpm lint          # Run linter
pnpm test --project=e2e-sauce-demo    # Run sample tests
```

All commands should complete without errors.

## IDE Setup

### Visual Studio Code

Recommended extensions:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### JetBrains IDEs (WebStorm, IntelliJ IDEA)

- Enable TypeScript compiler for project's `node_modules`
- Enable Prettier from project's `node_modules`

## Running Tests

```bash
# All tests (defaults to dev environment)
pnpm test

# Specific project
pnpm test --project=e2e-sauce-demo
pnpm test --project=api-petstore

# Single test file
pnpm test apps/e2e/sauce-demo/tests/login.e2e.ts

# Environment-specific
TEST_ENV=staging pnpm test
TEST_ENV=production pnpm test
```

## Debugging

```bash
pnpm test --debug      # Playwright Inspector
pnpm test --ui         # Playwright UI mode
HEADED=true pnpm test  # Run in headed mode
```

## Reports

```bash
make report-allure-open           # Generate and open Allure report
pnpm exec playwright show-report   # Playwright HTML report
```

## Troubleshooting

### Issue: Playwright browsers not found

```bash
pnpm exec playwright install --with-deps chromium
```

### Issue: TypeScript errors in IDE

1. Run `pnpm install`
2. Reload TypeScript server in IDE
3. Check `tsconfig.json` paths configuration

### Issue: Import errors with path aliases

1. Ensure correct import: `import { test } from '@sauce-demo-fixtures'`
2. Never import from base fixtures: `import { _baseTest } from '@/fixtures/base'` ❌

### Issue: Invalid TEST_ENV value

The framework now validates `TEST_ENV` and throws helpful errors:

```bash
TEST_ENV=invalid pnpm test
# Error: Invalid TEST_ENV value: "invalid". Valid values are: dev (or development), staging (or stg, stage), production (or prod).
```

## Configuration Files

| File                         | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `eslint.config.js`           | ESLint 9 flat config                         |
| `tsconfig.json`              | TypeScript config with path aliases          |
| `playwright.config.ts`       | Playwright test runner configuration         |
| `src/config/environments.ts` | Environment-specific settings                |
| `src/config/apps/*.ts`       | Application configurations (base URLs, auth) |

## Next Steps

- Read [TESTING.md](TESTING.md) for testing guidelines
- Explore example tests in `apps/` directory
- Read [CLAUDE.md](../CLAUDE.md) for framework overview
