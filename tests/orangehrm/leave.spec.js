const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/orangehrm/LoginPage');
const { LeavePage } = require('../../pages/orangehrm/LeavePage');
const testData = require('../../test-data/orangehrm-data.json');

test.describe('OrangeHRM Leave', () => {
    test.describe.configure({ timeout: 60000 });

    let leavePage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        leavePage = new LeavePage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.valid.username,
            testData.users.valid.password
        );
        await leavePage.navigateTo();
    });

    test('TC016 - Navigates to the Leave module', async () => {
        await expect(leavePage.leaveListHeading).toBeVisible();
    });

    test('TC017 - Displays the leave list and its columns', async () => {
        await expect(leavePage.leaveTable).toBeVisible();
        for (const columnName of testData.leaveColumns) {
            await expect(leavePage.leaveTable.getByRole('columnheader', {
                name: columnName,
                exact: true
            })).toBeVisible();
        }
    });

    test('TC018 - Displays leave filters', async () => {
        for (const filterLabel of testData.leaveFilters) {
            await expect(leavePage.getFilterGroup(filterLabel).first()).toBeVisible();
        }

        await expect(leavePage.searchButton).toBeVisible();
        await expect(leavePage.resetButton).toBeVisible();
    });

    test('TC019 - Searches leave records by employee name', async () => {
        await leavePage.searchByEmployeeName(testData.leaveSearchName);

        const resultRows = leavePage.getResultRows();
        const rowCount = await resultRows.count();

        if (rowCount === 0) {
            await expect(leavePage.noRecordsMessage).toBeVisible();
        } else {
            await expect(resultRows.first()).toContainText(testData.leaveSearchName);
        }
    });

    test('TC020 - Resets leave search filters', async () => {
        const initialFromDate = await leavePage.fromDateInput.inputValue();
        await leavePage.fromDateInput.fill('2026-01-02');
        await leavePage.resetFilters();

        await expect(leavePage.fromDateInput).toHaveValue(initialFromDate);
        await expect(leavePage.leaveTable).toBeVisible();
    });
});
