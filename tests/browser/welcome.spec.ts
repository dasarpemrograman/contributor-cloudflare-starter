import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('first run is usable and accessible, and links reach working APIs', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Cloudflare Starter' }),
  ).toBeVisible();
  await expect(
    page.getByText('Your Worker is ready', { exact: false }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('welcome.png'),
    fullPage: true,
  });

  await page.getByRole('link', { name: 'Try the greeting API' }).click();
  await expect(page.locator('body')).toContainText('Hello, contributor!');
  await page.goto('/');
  await page.getByRole('link', { name: 'Check application health' }).click();
  await expect(page.locator('body')).toContainText('"status":"ok"');
});
