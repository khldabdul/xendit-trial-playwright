import { When } from '@cucumber/cucumber';
import { CustomWorld } from '@/cucumber/world.js';

When('I wait for {int} seconds', async function (this: CustomWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});
