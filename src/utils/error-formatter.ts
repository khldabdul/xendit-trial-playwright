/**
 * Utility functions for cleaning up error messages for better readability
 * and stripping ANSI codes from error messages in test reports.
 */

/**
 * Strip ANSI escape codes from a string.
 * These codes (like [2m, [31m, [0m) appear as garbage in HTML reports.
 */
export function stripAnsiCodes(str: string): string {
  if (!str) return '';

  // Comprehensive ANSI escape code regex
  // Matches: ESC [ followed by numbers/semicolons and ending with m
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]/g;

  // Also match the [2m style codes that appear without the escape char
  const bracketCodes = /\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?m/g;

  return str.replace(ansiRegex, '').replace(bracketCodes, '').trim();
}

/**
 * Clean up Playwright assertion error messages for better readability.
 * Removes technical noise and keeps the essential information.
 */
export function cleanAssertionMessage(message: string): string {
  if (!message) return '';

  let cleaned = stripAnsiCodes(message);

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Clean up common Playwright assertion patterns
  cleaned = cleaned
    .replace(/expect\(received\)\.toContain\(expected\)/gi, 'Expected to contain')
    .replace(/expect\(received\)\.toEqual/gi, 'Expected to equal')
    .replace(/expect\(received\)\.toBe\(/gi, 'Expected to be')
    .replace(/expect\(received\)\.toBeDefined/gi, 'Expected to be defined')
    .replace(/expect\(received\)\.toBeTruthy/gi, 'Expected to be truthy')
    .replace(/expect\(received\)\.toBeFalsy/gi, 'Expected to be falsy')
    .replace(/expect\(received\)\.toHaveLength/gi, 'Expected length')
    .replace(/expect\(received\)\.toBeVisible/gi, 'Expected element to be visible')
    .replace(/expect\(received\)\.toBeEnabled/gi, 'Expected element to be enabled')
    .replace(/Received array:/gi, 'Received:')
    .replace(/Expected value:/gi, 'Expected:');

  return cleaned;
}

/**
 * Clean up stack traces by removing node_modules and internal paths.
 */
export function cleanStackTrace(stack: string | undefined): string {
  if (!stack) return '';

  const lines = stack.split('\n');
  const cleanLines: string[] = [];

  for (const line of lines) {
    const cleanLine = stripAnsiCodes(line);

    // Skip empty lines
    if (!cleanLine.trim()) continue;

    // Skip node_modules paths (keep them shorter)
    if (cleanLine.includes('node_modules')) {
      continue;
    }

    // Skip internal Playwright library paths
    if (cleanLine.includes('playwright/lib') || cleanLine.includes('@playwright')) {
      continue;
    }

    // Skip anonymous function noise
    if (cleanLine.includes('(anonymous)') || cleanLine.includes('Proxy.')) {
      continue;
    }

    cleanLines.push(cleanLine);
  }

  // Limit stack trace to first 5 relevant lines
  return cleanLines.slice(0, 5).join('\n');
}

/**
 * Format an error for display in the HTML report.
 */
export function formatErrorForReport(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message || '';
  const stack = typeof error === 'string' ? '' : error.stack || '';

  const cleanMessage = cleanAssertionMessage(message);
  const cleanStack = cleanStackTrace(stack);

  if (cleanStack && cleanStack !== cleanMessage) {
    return `${cleanMessage}\n\nStack Trace:\n${cleanStack}`;
  }

  return cleanMessage;
}
