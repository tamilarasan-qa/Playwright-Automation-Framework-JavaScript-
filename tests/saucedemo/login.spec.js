const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/saucedemo/LoginPage');
const testData = require('../../test-data/saucedemo-data.json');

test.describe('SauceDemo login', () => {
    test.describe.configure({ timeout: 60000 });

    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.open(testData.baseUrl);
    });

    test('TC001 - Logs in with valid credentials', async ({ page }) => {
        await loginPage.login(
            testData.users.standard.username,
            testData.users.standard.password
        );

        await expect(page).toHaveURL(/inventory\.html$/);
        await expect(page.getByText('Products', { exact: true })).toBeVisible();
    });

    test('TC002 - Rejects an invalid username', async ({ page }) => {
        await loginPage.login(
            testData.users.invalidUsername,
            testData.users.standard.password
        );

        await expect(loginPage.errorMessage).toContainText(
            'Epic sadface: Username and password do not match any user in this service'
        );
        await expect(page).toHaveURL(testData.baseUrl);
    });

    test('TC003 - Rejects an invalid password', async ({ page }) => {
        await loginPage.login(
            testData.users.standard.username,
            testData.users.invalidPassword
        );

        await expect(loginPage.errorMessage).toContainText(
            'Epic sadface: Username and password do not match any user in this service'
        );
        await expect(page).toHaveURL(testData.baseUrl);
    });

    test('TC004 - Requires a username when both credentials are empty', async ({ page }) => {
        await loginPage.login('', '');

        await expect(loginPage.errorMessage).toContainText('Epic sadface: Username is required');
        await expect(page).toHaveURL(testData.baseUrl);
    });

    test('TC005 - Shows the locked-out user message', async ({ page }) => {
        await loginPage.login(
            testData.users.lockedOut.username,
            testData.users.lockedOut.password
        );

        await expect(loginPage.errorMessage).toContainText(
            'Epic sadface: Sorry, this user has been locked out.'
        );
        await expect(page).toHaveURL(testData.baseUrl);
    });
});
