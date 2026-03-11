/**
 * Environment configuration
 */

import type { EnvironmentConfig } from '@/types/config.types';

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    description: 'Development environment',
    defaultTimeout: 30000,
    screenshotOnFailure: true,
    video: 'retain-on-failure',
    tracing: 'retain-on-failure',
    browsers: {
      chromium: {},
      chrome: { channel: 'chrome' },
      firefox: {},
      webkit: {},
    },
    viewports: {
      desktop: { width: 1920, height: 1080 },
      laptop: { width: 1366, height: 768 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 812 },
    },
  },
  staging: {
    name: 'staging',
    description: 'Staging environment',
    defaultTimeout: 45000,
    screenshotOnFailure: true,
    video: 'retain-on-failure',
    tracing: 'retain-on-failure',
    browsers: {
      chromium: {},
      chrome: { channel: 'chrome' },
      firefox: {},
      webkit: {},
    },
    viewports: {
      desktop: { width: 1920, height: 1080 },
      laptop: { width: 1366, height: 768 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 812 },
    },
  },
  production: {
    name: 'production',
    description: 'Production environment (read-only tests)',
    defaultTimeout: 60000,
    screenshotOnFailure: true,
    video: 'off',
    tracing: 'off',
    browsers: {
      chromium: {},
      chrome: { channel: 'chrome' },
      firefox: {},
      webkit: {},
    },
    viewports: {
      desktop: { width: 1920, height: 1080 },
      laptop: { width: 1366, height: 768 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 812 },
    },
  },
};

export default environments;
