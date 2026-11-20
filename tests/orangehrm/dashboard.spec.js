const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/orangehrm/LoginPage');
const { DashboardPage } = require('../../pages/orangehrm/DashboardPage');
const testData = require('../../test-data/orangehrm-data.json');

test.describe('OrangeHRM dashboard', () => {
    test.describe.configure({ timeout: 60000 });

    let dashboardPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.valid.username,
            testData.users.valid.password
        );
        await dashboardPage.navigateToModule('Dashboard');
    });

    test('TC006 - Displays the dashboard after login', async ({ page }) => {
        await expect(page).toHaveURL(/\/dashboard\/index$/);
        await expect(page.getByText('Time at Work', { exact: true })).toBeVisible();
    });

    test('TC007 - Displays the dashboard widgets', async () => {
        for (const widgetTitle of dashboardPage.widgetTitles) {
            await expect(widgetTitle).toBeVisible();
        }
    });

    test('TC008 - Displays the application navigation menu', async ({ page }) => {
        for (const moduleName of testData.navigationModules) {
            await expect(page.getByRole('link', {
                name: moduleName,
                exact: true
            })).toBeVisible();
        }
    });

    test('TC009 - Opens the user profile menu', async ({ page }) => {
        await dashboardPage.openUserProfileMenu();

        await expect(page.getByRole('menuitem', {
            name: 'About',
            exact: true
        })).toBeVisible();
        await expect(page.getByRole('menuitem', {
            name: 'Change Password',
            exact: true
        })).toBeVisible();
        await expect(dashboardPage.logoutMenuItem).toBeVisible();
    });

    test('TC025 - Logs out from the user profile menu', async ({ page }) => {
        await dashboardPage.logout();

        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('TC026 - Redirects to login when the dashboard is opened after logout', async ({ page }) => {
        await dashboardPage.logout();
        await page.goto(`${testData.baseUrl}web/index.php/dashboard/index`);

        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });
});
