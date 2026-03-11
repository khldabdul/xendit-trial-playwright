/**
 * Test Step Utilities
 *
 * Provides helper functions for creating explicit test steps
 * that mimic Python's `with allure.step():` pattern.
 *
 * @example
 * ```ts
 * await step('Navigate to login page', async () => {
 *   await pages.login.goto();
 * });
 * ```
 */

import type { MinimalAllureReporter } from '@/types/config.types';

/**
 * Create an explicit test step
 *
 * Use this in tests to create clear, readable steps in Allure reports.
 * This mimics Python's `with allure.step():` pattern.
 *
 * @param name - Step name (can include parameters via template strings)
 * @param fn - Async function to execute within this step
 * @returns Promise that resolves when step completes
 *
 * @example
 * ```ts
 * await step('Login as standard_user', async () => {
 *   await pages.login.login('standard_user', 'secret_sauce');
 * });
 * ```
 */
export async function step<T>(
  allure: MinimalAllureReporter,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return allure.step(name, fn);
}

/**
 * Create a series of related test steps
 *
 * Useful for grouping multiple related actions under a parent step.
 *
 * @param name - Parent step name
 * @param fn - Function containing child steps
 * @returns Promise that resolves when all steps complete
 *
 * @example
 * ```ts
 * await testSection('Complete checkout flow', async () => {
 *   await step('Add items to cart', async () => { ... });
 *   await step('Navigate to checkout', async () => { ... });
 *   await step('Complete payment', async () => { ... });
 * });
 * ```
 */
export async function testSection<T>(
  allure: MinimalAllureReporter,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return allure.step(name, fn);
}

/**
 * Type-safe fixture helper for creating steps
 *
 * This is meant to be used within test fixtures that provide allure.
 */
export type StepHelper = {
  /** Create a named test step */
  step: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  /** Create a section of related steps */
  section: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
};

/**
 * Create a step helper from allure reporter
 */
export function createStepHelper(allure: MinimalAllureReporter): StepHelper {
  return {
    step: <T>(name: string, fn: () => Promise<T>) => step(allure, name, fn),
    section: <T>(name: string, fn: () => Promise<T>) => testSection(allure, name, fn),
  };
}
