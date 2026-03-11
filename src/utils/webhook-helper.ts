import { APIRequestContext } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types.js';

/**
 * Polls webhook.site for a specific Xendit webhook request.
 * Useful for testing asynchronous webhook flows without a dedicated backend server.
 *
 * When an `allure` reporter is provided the function attaches:
 * - **Webhook Received Payload** – the full JSON body of the matched webhook
 *
 * @param request The Playwright APIRequestContext instance.
 * @param webhookSiteToken The unique token UUID provided by Webhook.site
 * @param externalId The unique external_id of the transaction we're waiting for.
 * @param status The expected status (default: 'PAID')
 * @param allure Optional Allure reporter for attaching the received webhook payload.
 * @returns The parsed JSON payload of the received webhook.
 */
export async function waitForXenditWebhook(
  request: APIRequestContext,
  webhookSiteToken: string,
  externalId: string,
  status: string = 'PAID',
  allure?: MinimalAllureReporter
) {
  const maxRetries = 15;
  const retryInterval = 2000;

  for (let i = 0; i < maxRetries; i++) {
    // Check webhook.site API for incoming requests to our token
    const response = await request.get(`https://webhook.site/token/${webhookSiteToken}/requests`, {
      ignoreHTTPSErrors: true,
    });
    
    if (response.ok()) {
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        // Look through recent requests for one that matches our transaction
        const targetWebhook = data.data.find((req: any) => {
          if (!req.content) return false;
          try {
            const payload = JSON.parse(req.content);
            return payload.external_id === externalId && payload.status === status;
          } catch (error) {
            // Unparseable content, probably not our webhook
            return false;
          }
        });

        if (targetWebhook) {
          const webhookPayload = JSON.parse(targetWebhook.content);

          // Attach the matched webhook payload to the report for traceability
          if (allure) {
            try {
              allure.attachment(
                `Webhook Received – ${status} (external_id: ${externalId})`,
                JSON.stringify(webhookPayload, null, 2),
                { contentType: 'application/json' }
              );
            } catch {
              // Non-blocking; never fail a test because of a logging error
            }
          }

          return webhookPayload; // Found our webhook!
        }
      }
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  throw new Error(`Webhook for external_id '${externalId}' with status '${status}' never received on webhook.site`);
}
