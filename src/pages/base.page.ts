/**
 * Base Page Object with common utilities and automatic Allure steps
 *
 * All page objects should extend this class to inherit:
 * - Automatic Allure step wrapping for actions (with expandable details)
 * - Common page interaction methods
 * - Screenshot and attachment utilities
 *
 * Step hierarchy:
 * - Page object methods: Most descriptive top-level steps (e.g., "Add 'Backpack' to cart")
 * - BasePage methods: Generic nested steps (e.g., "Click element") with expandable selector details
 */

import type { Page, Locator } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';

export class BasePage {
  protected page: Page;
  protected allure: MinimalAllureReporter;
  protected baseUrl: string;

  constructor(page: Page, allure: MinimalAllureReporter, baseUrl: string) {
    this.page = page;
    this.allure = allure;
    this.baseUrl = baseUrl;
  }

  /**
   * Navigate to URL
   */
  async goto(url: string): Promise<void> {
    await this.allure.step(`Navigate to ${url}`, async () => {
      await this.page.goto(url);
    });
  }

  /**
   * Navigate to baseUrl (with optional path)
   */
  async gotoUrl(path?: string): Promise<void> {
    const url = path ? `${this.baseUrl}${path}` : this.baseUrl;
    await this.goto(url);
  }

  /**
   * Get element by data-test attribute
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by ARIA role
   */
  getByRole(role: string, options = {}): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Get element by text content
   */
  getByText(text: string, options = {}): Locator {
    return this.page.getByText(text, options);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Get element by label (for form inputs)
   */
  getByLabel(text: string): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Wait for element to be visible
   * Accepts either a selector string or a Locator
   */
  async waitForElement(selector: string | Locator, timeout = 10000): Promise<Locator> {
    const selectorStr = typeof selector === 'string' ? selector : 'locator';
    return await this.allure.step(`Wait for element: ${selectorStr}`, async () => {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
      await locator.waitFor({ state: 'visible', timeout });
      return locator;
    });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string, timeout = 10000): Promise<void> {
    await this.allure.step(`Wait for element to be hidden: ${selector}`, async () => {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: 'hidden', timeout });
    });
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(url: string | RegExp, timeout = 10000): Promise<void> {
    await this.allure.step(`Wait for URL: ${url}`, async () => {
      await this.page.waitForURL(url, { timeout });
    });
  }

  /**
   * Wait for load state
   */
  async waitForLoadState(
    state: 'load' | 'domcontentloaded' | 'networkidle' = 'load',
    timeout = 30000
  ): Promise<void> {
    await this.allure.step(`Wait for page load: ${state}`, async () => {
      await this.page.waitForLoadState(state, { timeout });
    });
  }

  /**
   * Fill input
   * Accepts either a selector string or a Locator
   */
  async fill(selector: string | Locator, value: string, timeout = 10000): Promise<void> {
    const selectorStr = typeof selector === 'string' ? selector : 'locator';
    await this.allure.step(`Fill "${value}" into ${selectorStr}`, async () => {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
      await locator.fill(value, { timeout });
    });
  }

  /**
   * Clear input field
   */
  async clear(selector: string, timeout = 10000): Promise<void> {
    await this.allure.step(`Clear ${selector}`, async () => {
      await this.page.locator(selector).clear({ timeout });
    });
  }

  /**
   * Type text with optional delay
   */
  async type(selector: string, text: string, delay = 0): Promise<void> {
    await this.allure.step(`Type "${text}" into ${selector}`, async () => {
      await this.page.locator(selector).type(text, { delay });
    });
  }

  /**
   * Click element
   * Accepts either a selector string or a Locator
   */
  async click(selector: string | Locator, timeout = 10000): Promise<void> {
    const selectorStr = typeof selector === 'string' ? selector : 'locator';
    await this.allure.step(`Click on ${selectorStr}`, async () => {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
      await locator.click({ timeout });
    });
  }

  /**
   * Double click element
   */
  async doubleClick(selector: string, timeout = 10000): Promise<void> {
    await this.allure.step(`Double click on ${selector}`, async () => {
      await this.page.locator(selector).dblclick({ timeout });
    });
  }

  /**
   * Right click element
   */
  async rightClick(selector: string, timeout = 10000): Promise<void> {
    await this.allure.step(`Right click on ${selector}`, async () => {
      await this.page.locator(selector).click({ button: 'right', timeout });
    });
  }

  /**
   * Hover over element
   */
  async hover(selector: string, timeout = 10000): Promise<void> {
    await this.allure.step(`Hover over ${selector}`, async () => {
      await this.page.locator(selector).hover({ timeout });
    });
  }

  /**
   * Select option from dropdown
   * Accepts either a selector string or a Locator
   */
  async selectOption(selector: string | Locator, value: string): Promise<void> {
    const selectorStr = typeof selector === 'string' ? selector : 'locator';
    await this.allure.step(`Select "${value}" from ${selectorStr}`, async () => {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
      await locator.selectOption(value);
    });
  }

  /**
   * Check checkbox
   */
  async check(selector: string): Promise<void> {
    await this.allure.step(`Check ${selector}`, async () => {
      await this.page.locator(selector).check();
    });
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string): Promise<void> {
    await this.allure.step(`Uncheck ${selector}`, async () => {
      await this.page.locator(selector).uncheck();
    });
  }

  /**
   * Take screenshot and attach to Allure report
   */
  async takeScreenshot(name: string, fullPage = true): Promise<void> {
    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png',
    });

    this.allure.attachment(name, Buffer.from(screenshot), { contentType: 'image/png' });
  }

  /**
   * Get text content of element
   */
  async getText(selector: string, timeout = 10000): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return (await locator.textContent()) ?? '';
  }

  /**
   * Get inner HTML of element
   */
  async getHTML(selector: string): Promise<string> {
    return (await this.page.locator(selector).innerHTML()) ?? '';
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is hidden
   */
  async isHidden(selector: string): Promise<boolean> {
    return !(await this.isVisible(selector));
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    await this.allure.step(`Scroll ${selector} into view`, async () => {
      await this.page.locator(selector).scrollIntoViewIfNeeded();
    });
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(url?: string): Promise<void> {
    if (url) {
      await this.allure.step(`Wait for navigation to: ${url}`, async () => {
        await this.page.waitForURL(url);
      });
    } else {
      await this.allure.step('Wait for navigation', async () => {
        await this.page.waitForLoadState('domcontentloaded');
      });
    }
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.allure.step('Reload page', async () => {
      await this.page.reload();
    });
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.allure.step('Go back in browser history', async () => {
      await this.page.goBack();
    });
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.allure.step('Go forward in browser history', async () => {
      await this.page.goForward();
    });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getURL(): string {
    return this.page.url();
  }

  /**
   * Execute JavaScript in page context
   * Supports both no-arg and single-arg functions
   */
  async evaluate<R, A = never>(pageFunction: (() => R) | ((arg: A) => R), arg?: A): Promise<R> {
    return await this.page.evaluate(pageFunction as any, arg as any);
  }
}
