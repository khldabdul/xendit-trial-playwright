/**
 * Xendit test data configuration
 *
 * All sensitive values are sourced exclusively from environment variables.
 * Do NOT hardcode credentials or secrets here.
 */

import type { TestData } from '@/types/config.types';

export const testData: TestData = {
  credentials: {
    xendit: {
      username: process.env.XENDIT_USERNAME || '',
      password: process.env.XENDIT_PASSWORD || '',
    },
  },

  api: {
    xendit: {
      baseUrl: process.env.XENDIT_API_URL || 'https://api.xendit.co',
      secretKey: process.env.XENDIT_SECRET_KEY || '',
      publicKey: process.env.XENDIT_PUBLIC_KEY || '',
      webhookSiteToken: process.env.WEBHOOK_SITE_TOKEN || '',
    },
  },

  urls: {
    xenditDashboard: {
      dev: process.env.BASE_URL || 'https://dashboard.xendit.co',
      staging: process.env.BASE_URL || 'https://dashboard.xendit.co',
      production: 'https://dashboard.xendit.co',
    },
  },

  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    veryLong: 30000,
  },
};

export default testData;
