# Testing Guidelines

Best practices, patterns, and conventions for writing tests.

## Test Structure

### Basic Test File

```typescript
// apps/e2e/sauce-demo/tests/login.e2e.ts
import { sauceDemoTest } from '@sauce-demo-fixtures';

export const test = sauceDemoTest;

test('descriptive test name', async ({ pages }) => {
  await pages.login.goto();
  await pages.login.login('standard_user', 'secret_sauce');
});
```

### File Locations

```
apps/
├── e2e/{app}/
│   ├── tests/        # Test files
│   └── pages/        # Page objects
└── api/{app}/
    ├── tests/        # Test files
    └── clients/      # API clients
```

## Writing Tests

### E2E Tests

```typescript
import { sauceDemoTest } from '@sauce-demo-fixtures';

export const test = sauceDemoTest;

test('adds item to cart', async ({ pages }) => {
  await pages.inventory.goto();
  await pages.inventory.addToCart('sauce-labs-backpack');
  await expect(pages.inventory.cartBadge).toHaveText('1');
});
```

### API Tests

```typescript
import { petstoreTest } from '@petstore-fixtures';

export const test = petstoreTest;

test('creates a new pet', async ({ clients }) => {
  const newPet = { id: Date.now(), name: 'Fluffy', status: 'available' };
  const response = await clients.petstore.addPet(newPet);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.name).toBe(newPet.name);
});
```

> **Important**: All API client methods return Promises. Always use `await`.

### Data-Driven Tests

```typescript
const testUsers = [
  { username: 'standard_user', shouldSucceed: true },
  { username: 'locked_out_user', shouldSucceed: false },
];

for (const { username, shouldSucceed } of testUsers) {
  test(`logs in with ${username}`, async ({ pages }) => {
    await pages.login.goto();
    await pages.login.login(username, 'secret_sauce');

    if (shouldSucceed) {
      await expect(pages.inventory.headerTitle).toBeVisible();
    } else {
      await expect(pages.login.errorMessage).toContainText('locked out');
    }
  });
}
```

## Page Objects

All page objects extend `BasePage`:

```typescript
// apps/e2e/sauce-demo/pages/LoginPage.ts
import { BasePage } from '@/pages/base.page';
import type { Page, Locator } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page, allure: MinimalAllureReporter, baseUrl: string) {
    super(page, allure, baseUrl);
    this.usernameInput = this.page.locator('[data-test="username"]');
    this.passwordInput = this.page.locator('[data-test="password"]');
    this.loginButton = this.page.locator('[data-test="login-button"]');
  }

  async login(username: string, password: string): Promise<void> {
    await this.allure.step(`Login as ${username}`, async () => {
      await this.fill(this.usernameInput, username);
      await this.fill(this.passwordInput, password);
      await this.click(this.loginButton);
    });
  }
}
```

## Fixtures

### App-Specific Fixtures

Always import from app fixtures:

```typescript
// ✅ CORRECT
import { sauceDemoTest } from '@sauce-demo-fixtures';
import { petstoreTest } from '@petstore-fixtures';

// ❌ WRONG - Never import from base fixtures
import { _baseTest } from '@/fixtures/base';
```

### Available Fixtures

**E2E Tests:**

- `pages` - All page object instances
- `envConfig` - Environment configuration
- `env` - Current environment name
- `runId` - Unique test run identifier

**API Tests:**

- `clients` - Typed API client instances
  - `clients.petstore`
  - `clients.omdb`
  - `clients.reqres`
  - `clients.restfulBooker`
- `envConfig` - Environment configuration
- `env` - Current environment name

## Best Practices

### 1. Keep Tests Independent

Each test should run independently without relying on state from other tests.

### 2. Use Page Objects

Don't use selectors directly in tests:

```typescript
// ❌ Bad
test('logs in', async ({ page }) => {
  await page.fill('#user-name', 'standard_user');
  await page.click('#login-button');
});

// ✅ Good
test('logs in', async ({ pages }) => {
  await pages.login.login('standard_user', 'secret_sauce');
});
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good
test('adds multiple items to cart and verifies total', async ({ pages }) => {});

// ❌ Bad
test('cart test', async ({ pages }) => {});
```

### 4. Always Add Assertions

```typescript
test('verifies product added to cart', async ({ pages }) => {
  await pages.inventory.addToCart('backpack');
  await expect(pages.inventory.cartBadge).toHaveText('1'); // Always assert
});
```

### 5. Avoid Hardcoded Waits

```typescript
// ✅ Good - auto-wait
await expect(page.locator('.button')).toBeVisible();

// ❌ Bad - hardcoded wait
await page.waitForTimeout(5000);
```

## Common Patterns

### Grouping Tests

```typescript
test.describe('Shopping Cart', () => {
  test('adds item to cart', async ({ pages }) => {});
  test('removes item from cart', async ({ pages }) => {});
});
```

### Setup/Teardown

```typescript
test.beforeEach(async ({ clients }) => {
  await clients.petstore.addPet({ id: 123, name: 'Test Pet' });
});

test.afterEach(async ({ clients }) => {
  await clients.petstore.deletePet(123);
});
```

## Debugging

```bash
pnpm test --debug              # Playwright Inspector
pnpm test --ui                 # Playwright UI mode
HEADED=true pnpm test          # Run in headed mode
```

## More Resources

- [Playwright Documentation](https://playwright.dev)
- [Allure Documentation](https://docs.qameta.io/allure/)
- [CLAUDE.md](../CLAUDE.md) - Framework overview
