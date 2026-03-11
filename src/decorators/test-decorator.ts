/**
 * Test-Level Decorator System
 *
 * Provides decorators for individual test methods with enhanced metadata support.
 * Includes severity, test data, descriptions, and Allure integration.
 *
 * Example:
 * ```typescript
 * import { test, severity, withTestData } from '@/decorators';
 *
 * class LoginPageTests {
 *   @test.severity('critical')
 *   @test.withTestData({ username: 'standard_user', password: 'secret_sauce' })
 *   async loginWithValidCredentials() {
 *     await this.page.goto();
 *     await this.login('standard_user', 'secret_sauce');
 *   }
 * }
 * ```
 */

import type { MinimalAllureReporter } from '@/types/config.types';

/**
 * Method decorator type
 */
type MethodDecorator = (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void;

/**
 * Severity levels for tests
 */
export type Severity = 'blocker' | 'critical' | 'high' | 'normal' | 'low' | 'trivial';

/**
 * Test data attachment options
 */
export interface TestDataOptions {
  /** Name for the test data attachment in Allure */
  name?: string;

  /** Whether to attach as JSON string */
  asJson?: boolean;

  /** Whether to attach as file reference */
  asFile?: boolean;
}

/**
 * Test data decorator - attaches test data to Allure report
 *
 * @param data - Test data object or options
 */
export function withTestData(data: Record<string, any> | TestDataOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      // Apply suite metadata
      const result = await originalMethod.apply(this, rest);

      // Attach test data after test execution
      const allure = (this as any).allure as MinimalAllureReporter;

      // Check if data is options or raw data
      const isOptions =
        typeof data === 'object' && 'name' in data && ('asJson' in data || 'asFile' in data);
      const options = isOptions ? (data as TestDataOptions) : { name: 'testData' };

      const content = options.asJson ? JSON.stringify(data, null, 2) : String(data);

      if (options.asFile) {
        allure.attachment(options.name || 'testData', Buffer.from(JSON.stringify(data, null, 2)), {
          contentType: 'application/json',
        });
      } else {
        allure.parameter(options.name || 'testData', content);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Severity decorator - marks test with severity level
 *
 * @param level - The severity level
 */
export function severity(level: Severity): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply severity to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.severity(level);

      return result;
    };

    return descriptor;
  };
}

/**
 * Convenience severity decorators
 */
export const blocker = severity('blocker');
export const critical = severity('critical');
export const high = severity('high');
export const normal = severity('normal');
export const low = severity('low');
export const trivial = severity('trivial');

/**
 * Description decorator - adds detailed test description
 *
 * @param description - Test description (supports markdown)
 */
export function description(description: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply description to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.description(description);

      return result;
    };

    return descriptor;
  };
}

/**
 * Label decorator - adds custom labels to test
 *
 * @param name - Label name
 * @param value - Label value
 */
export function label(name: string, value: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply label to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.label(name, value);

      return result;
    };

    return descriptor;
  };
}

/**
 * Epic decorator - adds epic to test
 *
 * @param epicName - Epic name
 */
export function epic(epicName: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply epic to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.epic(epicName);

      return result;
    };

    return descriptor;
  };
}

/**
 * Feature decorator - adds feature to test
 *
 * @param featureName - Feature name
 */
export function feature(featureName: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply feature to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.feature(featureName);

      return result;
    };

    return descriptor;
  };
}

/**
 * Story decorator - adds story to test
 *
 * @param storyName - Story name (for Jira, etc.)
 */
export function story(storyName: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply story to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.story(storyName);

      return result;
    };

    return descriptor;
  };
}

/**
 * Tag decorator - adds tag to test
 *
 * @param tags - One or more tags
 */
export function tag(...tags: string[]): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Apply tags to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      // Call allure.tag for each tag individually
      for (const t of tags) {
        allure.tag(t);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Issue decorator - adds issue link to test
 *
 * @param url - Issue URL
 * @param name - Issue name/ID
 */
export function issue(url: string, name?: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add issue link to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.link(url, { type: 'issue', name });

      return result;
    };

    return descriptor;
  };
}

/**
 * TMS decorator - adds TMS link to test
 *
 * @param url - TMS (Test Management System) URL
 */
export function tms(url: string, name?: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add TMS link to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.link(url, { type: 'tms', name });

      return result;
    };

    return descriptor;
  };
}

/**
 * Link decorator - adds generic link to test
 *
 * @param url - Link URL
 * @param name - Link name
 * @param type - Link type (issue, tms, etc.)
 */
export function link(
  url: string,
  name?: string,
  type?: 'issue' | 'tms' | 'link' | 'custom'
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add link to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.link(url, { type: type || 'link', name });

      return result;
    };

    return descriptor;
  };
}

/**
 * ID decorator - adds test case ID for tracking
 *
 * @param id - Test case ID
 */
export function testCaseId(id: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add test case ID to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.parameter('testCaseId', id);

      return result;
    };

    return descriptor;
  };
}

/**
 * Owner decorator - adds test owner
 *
 * @param owner - Owner name or email
 */
export function owner(owner: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add owner to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.label('owner', owner);

      return result;
    };

    return descriptor;
  };
}

/**
 * Lead decorator - adds test lead (QA/Developer)
 *
 * @param lead - Lead name
 */
export function lead(lead: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Add lead to Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.label('lead', lead);

      return result;
    };

    return descriptor;
  };
}

/**
 * Flaky decorator - marks test as flaky (unstable)
 *
 * Flaky tests are those that fail intermittently
 */
export function flaky(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Mark as flaky in Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.label('flaky', 'true');

      return result;
    };

    return descriptor;
  };
}

/**
 * Muted decorator - marks test as muted (skipped, hidden)
 *
 * Muted tests don't count in pass/fail statistics
 */
export function muted(reason?: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Mark as muted in Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      if (reason) {
        allure.label('muted', reason);
      } else {
        allure.label('muted', 'true');
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Retries decorator - marks test that may need retries
 *
 * For tests that are known to be unstable
 */
export function retries(count: number): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...rest: any[]) {
      const result = await originalMethod.apply(this, rest);

      // Mark retries needed in Allure
      const allure = (this as any).allure as MinimalAllureReporter;
      allure.label('retries', count.toString());

      return result;
    };

    return descriptor;
  };
}
