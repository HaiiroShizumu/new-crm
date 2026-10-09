import { expect, test } from '@playwright/test';

/**
 * Post-deploy smoke against staging.
 * Requires a seeded workspace user (SMOKE_LOGIN / SMOKE_PASSWORD).
 * Enable in GHA with repository variable SMOKE_STAGING_ENABLED=true after cutover.
 *
 * NOT RUN until staging cutover on dev.crm-systems-ai.ru.
 */

const login = process.env.SMOKE_LOGIN ?? '';
const password = process.env.SMOKE_PASSWORD ?? '';

test.describe('staging smoke', () => {
  test.beforeEach(() => {
    test.skip(
      !login || !password,
      'SMOKE_LOGIN / SMOKE_PASSWORD not set — NOT RUN',
    );
  });

  test('login, open tasks, create a task', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const continueWithEmail = page.getByRole('button', {
      name: /Continue with Email|email/i,
    });
    if (await continueWithEmail.isVisible().catch(() => false)) {
      await continueWithEmail.click();
    }

    await page.locator('input[type="email"], input[name="email"]').first().fill(login);
    const continueButton = page.getByRole('button', { name: /Continue|Next/i });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: /Sign in|Log in|Continue/i }).click();
    await page.waitForLoadState('networkidle');

    // Workspace picker (dev-seed) if present
    const apple = page.getByText('Apple', { exact: true });
    if (await apple.isVisible().catch(() => false)) {
      await apple.click();
      await page.waitForLoadState('networkidle');
    }

    // Tasks nav — Twenty left menu
    const tasksNav = page.getByRole('link', { name: /^Tasks$/i }).or(
      page.getByText(/^Tasks$/i).first(),
    );
    await tasksNav.click();
    await page.waitForLoadState('networkidle');

    const title = `smoke-${Date.now()}`;
    const newButton = page
      .getByRole('button', { name: /New|Add|Create/i })
      .first();
    await newButton.click();

    const titleInput = page.locator('input').first();
    await titleInput.fill(title);
    await titleInput.press('Enter');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 60_000 });
  });
});
