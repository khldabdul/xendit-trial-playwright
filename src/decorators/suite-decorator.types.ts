/**
 * Suite Decorator Type Definitions
 */

/**
 * Options for suite configuration
 */
export interface SuiteOptions {
  /** Epic/Category for this suite */
  epic?: string;

  /** Feature/Component being tested */
  feature?: string;

  /** Tags for organizing tests */
  tags?: string[];

  /** Story ID for Jira integration */
  story?: string;

  /** Test data attachment name */
  testDataFile?: string;
}

/**
 * Suite builder helper
 */
export interface SuiteBuilder {
  /** Set the epic for this suite */
  epic(epic: string): SuiteBuilder;

  /** Set the feature for this suite */
  feature(feature: string): SuiteBuilder;

  /** Add tags to this suite */
  tags(...tags: string[]): SuiteBuilder;

  /** Attach test data file */
  withTestData(file: string): SuiteBuilder;
}

/**
 * Method decorator signature
 */
export type MethodDecorator = (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void;

/**
 * Helper to get current suite configuration
 */
export function getSuiteConfig(name: string): SuiteOptions {
  return new Map<string, SuiteOptions>().get(name) || {};
}
