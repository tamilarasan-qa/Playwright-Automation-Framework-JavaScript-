const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/orangehrm/LoginPage');
const testData = require('../../test-data/orangehrm-data.json');

test.describe('OrangeHRM login', () => {
    test.describe.configure({ timeout: 60000 });

    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
    });

    test('TC001 - Logs in with valid credentials', async ({ page }) => {
        await loginPage.login(
            testData.users.valid.username,
            testData.users.valid.password
        );

        await expect(page).not.toHaveURL(/\/auth\/login$/);
        await expect(page.getByRole('link', {
            name: 'PIM',
            exact: true
        })).toBeVisible();
    });

    test('TC002 - Rejects an invalid username', async ({ page }) => {
        await loginPage.login(
            testData.users.invalidUsername,
            testData.users.valid.password
        );

        await expect(loginPage.errorMessage).toContainText('Invalid credentials');
        await expect(page).toHaveURL(/\/auth\/login$/);
    });

    test('TC003 - Rejects an invalid password', async ({ page }) => {
        await loginPage.login(
            testData.users.valid.username,
            testData.users.invalidPassword
        );

        await expect(loginPage.errorMessage).toContainText('Invalid credentials');
        await expect(page).toHaveURL(/\/auth\/login$/);
    });

    test('TC004 - Requires a username', async ({ page }) => {
        await loginPage.login('', testData.users.valid.password);

        await expect(loginPage.getRequiredError('Username')).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/login$/);
    });

    test('TC005 - Requires a password', async ({ page }) => {
        await loginPage.login(testData.users.valid.username, '');

        await expect(loginPage.getRequiredError('Password')).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/login$/);
    });
});
