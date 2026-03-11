import { _baseApiTest } from '@/fixtures/api-base.js';
import { ApiFixtures } from '@/types/config.types.js';
import * as Clients from '../clients/index.js';

// Define the clients fixture structure
type XenditApiAppFixtures = ApiFixtures & {
  clients: {
    xendit: Clients.XenditApiClient;
  };
};

/**
 * Main Xendit API Test Fixture
 *
 * Use this for all Xendit API tests. It pre-configures:
 * 1. Allure metadata
 * 2. API client injection via the `clients` fixture
 */
export const xenditApiTest = _baseApiTest.extend<XenditApiAppFixtures>({
  // Configure Allure metadata for this app
  allure: async ({ allure }, use) => {
    // Basic Allure reporter might not have epic() depending on implementation
    if (typeof allure.epic === 'function') {
      allure.epic('Xendit API');
    }
    await use(allure);
  },

  // Inject all API clients. Note that apiRequest comes from _baseApiTest context.
  clients: async ({ apiRequest, allure }, use) => {
    const secretKey = process.env.XENDIT_SECRET_KEY || 'MISSING';
    const apiUrl = process.env.XENDIT_API_URL || 'https://api.xendit.co';
    
    // Lazy load the Xendit apiClient
    const { XenditApiClient } = await import('../clients/index.js');
    
    const clients = {
      xendit: new XenditApiClient(apiRequest, secretKey, apiUrl, allure),
    };
    
    await use(clients);
  },
});

export const expect = xenditApiTest.expect;
