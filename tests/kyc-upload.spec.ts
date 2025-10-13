import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.request.post('/api/test/reset');
});

test('allows uploading identity document and shows uploaded status', async ({page}) => {
  await page.goto('/it/app/identity');

  const statusBadge = page.getByText('Status: Missing');
  await expect(statusBadge).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/sample.png');

  await page.getByRole('button', {name: 'Save'}).click();
  await expect(page.getByText('Document uploaded successfully', {exact: false})).toBeVisible();
  await expect(page.getByText('Status: Uploaded')).toBeVisible();
});
