const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/orangehrm/LoginPage');
const { DirectoryPage } = require('../../pages/orangehrm/DirectoryPage');
const testData = require('../../test-data/orangehrm-data.json');

test.describe('OrangeHRM Directory', () => {
    test.describe.configure({ timeout: 60000 });

    let directoryPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        directoryPage = new DirectoryPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.valid.username,
            testData.users.valid.password
        );
        await directoryPage.navigateTo();
    });

    test('TC021 - Navigates to Directory', async () => {
        await expect(directoryPage.directoryHeading).toBeVisible();
    });

    test('TC022 - Displays employee directory cards', async () => {
        await expect(directoryPage.recordCount).toBeVisible();
        await expect(directoryPage.employeeCards.first()).toBeVisible();
    });

    test('TC023 - Searches for an employee by name', async () => {
        const employeeName = await directoryPage.searchByEmployeeName(
            testData.directorySearchPrefix
        );

        await expect(directoryPage.getEmployeeCard(employeeName).first()).toBeVisible();
    });

    test('TC024 - Shows matching employee directory search results', async () => {
        const employeeName = await directoryPage.searchByEmployeeName(
            testData.directorySearchPrefix
        );

        await expect(directoryPage.getEmployeeCard(employeeName).first()).toBeVisible();
        expect(await directoryPage.employeeCards.count()).toBeGreaterThan(0);
        await expect(directoryPage.getEmployeeCard(employeeName)).toContainText(employeeName);
    });
});
