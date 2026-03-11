import { _baseApiTest } from './api-base.js';
import { ApiFixtures } from '@/types/config.types.js';

type XenditFixtures = ApiFixtures & {
  // Add any Xendit-specific test helpers here if needed
};

// Export the test object with our custom API fixtures, including xenditApi
export const test = _baseApiTest.extend<XenditFixtures>({});
export const expect = test.expect;
