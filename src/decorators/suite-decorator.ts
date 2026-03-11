/**
 * Suite-Level Decorator System
 *
 * Provides decorators for applying metadata to entire test files/suites.
 * Use these at file level to set epic, feature, etc. for all tests.
 *
 * Example:
 * ```typescript
 * import { suite } from '@/decorators/suite-decorator';
 *
 * @suite('E2E Tests', {
 *   epic: 'Shopping',
 *   feature: 'Cart & Checkout'
 * })
 * ```
 */

import type { SuiteOptions } from './suite-decorator.types';

/**
 * Map to store active suite configurations
 * Key is a unique identifier for each suite configuration
 */
const suiteConfigs = new Map<string, SuiteOptions>();

/**
 * Method decorator type
 */
export type MethodDecorator = (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void;

/**
 * Apply suite decorator to a test file
 *
 * @param name - The suite name/identifier
 * @param options - Suite metadata options
 * @returns Decorator function
 */
export function suite(name: string, options: SuiteOptions): MethodDecorator {
  // Store suite configuration
  suiteConfigs.set(name, options);

  // Return method decorator
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Apply suite metadata to descriptor
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...rest: any[]) {
      // Call original method with suite context
      const result = originalMethod.apply(this, rest);

      // Get current suite config
      const config = suiteConfigs.get(name) || {};

      // Apply suite metadata as Allure labels
      if (config.epic) {
        this.allure?.epic(config.epic);
      }
      if (config.feature) {
        this.allure?.feature(config.feature);
      }
      if (config.tags) {
        this.allure?.tag(...config.tags);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Suite builder for fluent API
 *
 * @param name - Suite name/identifier
 */
export function buildSuite(name: string) {
  const config = suiteConfigs.get(name) || {};

  return {
    epic(epic: string) {
      suiteConfigs.set(name, { ...config, epic });
      return buildSuite(name);
    },

    feature(feature: string) {
      suiteConfigs.set(name, { ...config, feature });
      return buildSuite(name);
    },

    tags(...tags: string[]) {
      const current = suiteConfigs.get(name) || {};
      const merged = [...(current.tags || []), ...tags];
      suiteConfigs.set(name, { ...current, tags: merged });
      return buildSuite(name);
    },

    // Helper to get current config (for use in decorators)
    getConfig(name: string): SuiteOptions {
      return suiteConfigs.get(name) || {};
    },
  };
}

/**
 * Helper to apply suite configuration to a class
 *
 * @param target - Class or prototype
 * @param name - Suite name
 */
export function applySuiteConfig(target: object, name: string): void {
  const config = suiteConfigs.get(name) || {};

  if (config.epic) {
    // Apply epic to all test methods
    for (const prop of Object.getOwnPropertyNames(target)) {
      if (prop === 'allure' && typeof target[prop] === 'object') {
        (target[prop] as any).epic = config.epic;
      }
    }
  }
}
