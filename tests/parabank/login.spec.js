const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/parabank/LoginPage');
const testData = require('../../test-data/parabank-data.json');

test.describe('ParaBank login and logout', () => {
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
    });

    test('TC006 - Logs in with the verified public demo credentials', async ({ page }) => {
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );

        await expect(page).toHaveURL(/overview\.htm/);
        await expect(page.getByText(/^Welcome /)).toBeVisible();
    });

    test('TC007 - Rejects an invalid username', async ({ page }) => {
        await loginPage.login(
            testData.users.invalidUsername,
            testData.users.demo.password
        );

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(page).not.toHaveURL(/overview\.htm/);
    });

    test('TC008 - Rejects an invalid password', async ({ page }) => {
        await loginPage.login(
            testData.users.demo.username,
            testData.users.invalidPassword
        );

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(page).not.toHaveURL(/overview\.htm/);
    });

    test('TC009 - Rejects empty login credentials', async ({ page }) => {
        await loginPage.login('', '');

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(page).not.toHaveURL(/overview\.htm/);
    });

    test('TC010 - Logs out and returns to the customer login page', async ({ page }) => {
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );
        await loginPage.logout();

        await expect(page).toHaveURL(/index\.htm/);
        await expect(page.getByRole('heading', {
            name: 'Customer Login',
            exact: true
        })).toBeVisible();
        await expect(loginPage.usernameInput).toBeVisible();
    });
});
