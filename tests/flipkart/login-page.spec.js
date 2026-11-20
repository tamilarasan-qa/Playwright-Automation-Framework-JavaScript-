import { expect, test } from '@playwright/test';
import { FlipkartLoginPage } from '../pages/FlipkartLoginPage';

const FLIPKART_SEARCH_URL = 'https://www.flipkart.com/searchsuggestion';
const searchInput = (page) =>
  page.getByPlaceholder(/search for products, brands and more/i).first();

test('UI: Flipkart login page shows the initial phone-number form', async ({ page }) => {
  const loginPage = new FlipkartLoginPage(page);

  await loginPage.goto();
  await loginPage.expectInitialLoginForm();
});

test('Positive: a 10-digit phone number enables Continue', async ({ page }) => {
  const loginPage = new FlipkartLoginPage(page);

  await loginPage.goto();
  await loginPage.enterPhoneNumber('9876543210');

  await loginPage.expectContinueEnabled();
});

test('Negative and boundary: fewer than 10 digits are rejected; 10 digits are accepted', async ({ page }) => {
  const loginPage = new FlipkartLoginPage(page);

  await loginPage.goto();
  await loginPage.enterPhoneNumber('123456789');
  await loginPage.expectContinueDisabled();

  await loginPage.enterPhoneNumber('1234567890');
  await loginPage.expectContinueEnabled();
});

test.describe('Flipkart product search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FLIPKART_SEARCH_URL);
    await expect(page).toHaveURL(/\/searchsuggestion(?:[?#].*)?$/);
    await expect(searchInput(page)).toBeVisible();
  });

  test('UI: search page displays the product search field', async ({ page }) => {
    await expect(searchInput(page)).toBeVisible();
  });

  test('Positive: searching for iPhone shows matching products', async ({ page }) => {
    const search = searchInput(page);

    await expect(search).toBeVisible();
    await search.fill('iphone');
    await search.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=iphone(?:&|$)/i);
    await expect(
      page.getByRole('link', { name: /Apple iPhone/i }).first(),
    ).toBeVisible();
  });

  test('Negative: submitting an empty search does not open search results', async ({ page }) => {
    const search = searchInput(page);

    await expect(search).toBeVisible();
    await search.fill('');
    await search.press('Enter');

    await expect(search).toHaveValue('');
    await expect(page).toHaveURL(/\/searchsuggestion(?:[?#].*)?$/);
  });

  test('Boundary: a one-character query can be searched', async ({ page }) => {
    const search = searchInput(page);

    await expect(search).toBeVisible();
    await search.fill('a');
    await search.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=a(?:&|$)/i);
    await expect(page.getByText('Filters', { exact: true })).toBeVisible();
  });
});
