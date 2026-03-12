import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import {
  chromium,
  Browser,
  BrowserContext,
  Page,
  request,
  APIRequestContext,
} from '@playwright/test';
import { resolve } from 'path';
import { config } from 'dotenv';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env - env vars are available under cucumber-js (Playwright loads env
// automatically through playwright.config.ts, the BDD runner does not).
config({ path: resolve(process.cwd(), '.env') });

// Video storage directory
const VIDEO_DIR = join(process.cwd(), 'cucumber-report', 'videos');

// Ensure video directory exists and clean it before tests
const ensureVideoDir = () => {
  try {
    mkdirSync(VIDEO_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
};

export class CustomWorld extends World {
  private _browser!: Browser;
  private _context!: BrowserContext;
  private _page!: Page;
  private _apiContext!: APIRequestContext;

  // Test data storage for sharing between steps
  testData: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    const headless = process.env.HEADED !== 'true';

    // Ensure video directory exists
    ensureVideoDir();

    // Initialize browser
    this._browser = await chromium.launch({ headless });

    // Initialize browser context with viewport, video recording, and other settings
    this._context = await this._browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      ignoreHTTPSErrors: true,
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      recordVideo: {
        dir: VIDEO_DIR,
        size: { width: 1280, height: 720 },
      },
    });

    this._page = await this._context.newPage();

    // Initialize API context for API-only tests
    this._apiContext = await request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      ignoreHTTPSErrors: true,
    });
  }

  async cleanup(): Promise<void> {
    await this._page?.close();
    await this._context?.close();
    await this._browser?.close();
    await this._apiContext?.dispose();
  }

  get page(): Page {
    return this._page;
  }

  get apiContext(): APIRequestContext {
    return this._apiContext;
  }

  async getVideoPath(): Promise<string | null> {
    const video = this._page?.video();
    return video ? video.path() : null;
  }

  getData<T = unknown>(key: string): T | undefined {
    return this.testData[key] as T | undefined;
  }

  setData(key: string, value: unknown): void {
    this.testData[key] = value;
  }

  async attachScreenshot(label = 'Screenshot'): Promise<void> {
    if (this._page) {
      const screenshot = await this._page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');
    }
  }

  async closeContextForVideo(): Promise<void> {
    // Get video reference and path BEFORE closing the page
    const video = this._page?.video();
    let videoPath: string | null = null;

    if (video) {
      try {
        videoPath = await video.path();
      } catch (e) {
        console.log('  ⚠ Could not get video path:', e);
      }
    }

    // Close the page and context to finalize the video file
    await this._page?.close();
    await this._context?.close();

    // Now attach the video using the saved path
    if (videoPath) {
      try {
        // Small delay to ensure video file is fully written
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if video file exists
        if (existsSync(videoPath)) {
          const videoBuffer = readFileSync(videoPath);
          this.attach(videoBuffer, 'video/webm');
          console.log('  🎬 Video attached to report');
        } else {
          console.log('  ⚠ Video file not found:', videoPath);
        }
      } catch (e) {
        console.log('  ⚠ Could not attach video:', e);
      }
    }
  }
}

setWorldConstructor(CustomWorld);
