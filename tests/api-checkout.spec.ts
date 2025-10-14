import {test, expect} from '@playwright/test';

test('POST /api/checkout mock returns 200', async ({page}) => {
  await page.route('**/api/checkout', async (route) => {
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON() as {plan?: string};
    expect(body?.plan).toBe('starter');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({url: 'https://checkout.stripe.test/session'})
    });
  });

  await page.goto('/it');

  const responsePromise = page.waitForResponse('**/api/checkout');
  await page.evaluate(() =>
    fetch('/api/checkout', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({plan: 'starter'})
    })
  );

  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
