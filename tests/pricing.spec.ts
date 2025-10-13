import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.request.post('/api/test/reset');
});

test('redirects to Stripe checkout when selecting Starter plan', async ({page}) => {
  await page.route('**/api/checkout', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as {plan: string};
    expect(body.plan).toBe('starter');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({url: 'https://checkout.stripe.test/session'})
    });
  });

  await page.route('https://checkout.stripe.test/**', async (route) => {
    await route.fulfill({status: 200, contentType: 'text/html', body: '<html>ok</html>'});
  });

  await page.goto('/it');
  await page.getByRole('button', {name: /scegli starter/i}).click();
  await page.waitForURL('https://checkout.stripe.test/**');
});
