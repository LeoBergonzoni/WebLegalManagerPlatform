import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.request.post('/api/test/reset');
});

test('redirects unauthenticated user to sign-in', async ({page, context}) => {
  await context.addCookies([
    {name: 'test-auth', value: 'none', domain: 'localhost', path: '/'}
  ]);

  await page.goto('/it/app');
  await expect(page).toHaveURL(/\/it\/auth\/sign-in$/);
});
