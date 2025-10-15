import {test, expect} from '@playwright/test';

test('redirects to sign-in when callback fails', async ({page}) => {
  await page.goto('/api/auth/callback?code=dummy', {waitUntil: 'load'});
  await expect(page).toHaveURL(/\/en\/auth\/sign-in\?error=callback_failed$/);
});
