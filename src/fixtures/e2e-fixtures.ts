import { _baseTest, _baseExpect } from '@/fixtures/base.js';
import { ApiFixtures, TestDataFixture } from '@/types/config.types.js';

// Combine fixtures needed for E2E tests
type DashboardFixtures = TestDataFixture &
  ApiFixtures & {
    // We can add page objects as fixtures here later
  };

export const test = _baseTest.extend<DashboardFixtures>({
  xenditApi: async ({ request }, use) => {
    // Shared Xendit API Client creation for both UI and API tests to check state
    const { XenditApiClient } = await import('@/api/XenditApiClient.js');
    const secretKey = process.env.XENDIT_SECRET_KEY || 'MISSING';
    const apiUrl = process.env.XENDIT_API_URL || 'https://api.xendit.co';
    const client = new XenditApiClient(request, secretKey, apiUrl);
    await use(client);
  },
});

export const expect = _baseExpect;
