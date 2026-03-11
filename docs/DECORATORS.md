# Decorators & Allure Metadata

This framework uses fixture-based decorators for adding Allure metadata to tests.

## Pattern: Decorated Fixtures

Tests use pre-configured fixtures that include Allure metadata:

```typescript
// In apps/e2e/sauce-demo/fixtures/index.ts
export const sauceDemoAuthTest = createE2ETest(sauceDemoTest, {
  epic: 'Sauce Demo E2E',
  feature: 'Authentication',
  story: 'User Login',
  testcase: 'TC-SD-AUTH',
  app: 'sauce-demo',
  severity: 'critical',
  tags: ['auth', 'e2e'],
});

// In test file
import { sauceDemoAuthTest } from '@sauce-demo-fixtures';

export const test = sauceDemoAuthTest;

test('login works', async ({ pages }) => {
  // Already tagged with epic, feature, story, severity, etc.
});
```

## Available Decorated Fixtures

### Sauce Demo

```typescript
import { sauceDemoAuthTest, sauceDemoSmokeTest } from '@sauce-demo-fixtures';
```

### The Internet

```typescript
import { theInternetAuthTest } from '@the-internet-fixtures';
```

### Petstore API

```typescript
import { petstoreSmokeTest, petstoreUserTest } from '@petstore-fixtures';
```

### ReqRes API

```typescript
import { reqresUserTest, reqresSmokeTest } from '@reqres-fixtures';
```

### Restful Booker API

```typescript
import { restfulBookerSmokeTest } from '@restful-booker-fixtures';
```

### OMDB API

```typescript
import { omdbSmokeTest } from '@omdb-fixtures';
```

## Creating Decorated Fixtures

Use `createE2ETest` or `createAPITest` from `@/decorators/create-app-test`:

```typescript
import { createE2ETest } from '@/decorators/create-app-test';

export const myAppAuthTest = createE2ETest(myAppTest, {
  epic: 'My App',
  feature: 'Authentication',
  story: 'Login',
  testcase: 'TC-APP-001',
  app: 'my-app',
  severity: 'critical',
  smoke: true,
  tags: ['auth'],
});
```

## Decorator Options

| Option        | Type     | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `epic`        | string   | High-level epic/grouping                      |
| `feature`     | string   | Feature within epic                           |
| `story`       | string   | User story or scenario                        |
| `testcase`    | string   | Test case ID                                  |
| `severity`    | string   | blocker, critical, high, normal, low, trivial |
| `smoke`       | boolean  | Marks as smoke test                           |
| `critical`    | boolean  | Marks as critical test                        |
| `tags`        | string[] | Additional tags                               |
| `app`         | string   | Application name                              |
| `description` | string   | Test description                              |

## Allure Reporting

All tests automatically inherit metadata from their decorated fixture. The metadata appears in:

- **Epic/Feature** grouping in Allure
- **Severity** icons on tests
- **Tags** for filtering
- **Test Case IDs** for traceability
