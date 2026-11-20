const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/orangehrm/LoginPage');
const { PIMPage } = require('../../pages/orangehrm/PIMPage');
const testData = require('../../test-data/orangehrm-data.json');

test.describe('OrangeHRM PIM', () => {
    test.describe.configure({ timeout: 60000 });

    let pimPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        pimPage = new PIMPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.valid.username,
            testData.users.valid.password
        );
        await pimPage.navigateTo();
    });

    test('TC010 - Navigates to PIM', async () => {
        await expect(pimPage.employeeInformationHeading).toBeVisible();
    });

    test('TC011 - Displays the employee list', async () => {
        await expect(pimPage.employeeTable).toBeVisible();
        await expect(pimPage.recordCount).toBeVisible();
        expect(await pimPage.employeeTable.getByRole('row').count()).toBeGreaterThan(1);
    });

    test('TC012 - Searches for an employee by name', async () => {
        const employee = await pimPage.getFirstEmployee();
        await pimPage.searchByName(employee.name);

        await expect(pimPage.getEmployeeRows()).toHaveCount(1);
        await expect(pimPage.getEmployeeRows().first()).toContainText(
            employee.name.split(/\s+/)[0]
        );
    });

    test('TC013 - Searches for an employee by employee ID', async () => {
        const employee = await pimPage.getFirstEmployee();
        await pimPage.searchByEmployeeId(employee.id);

        await expect(pimPage.getEmployeeRows()).toHaveCount(1);
        await expect(pimPage.getEmployeeRows().first()).toContainText(employee.id);
    });

    test('TC014 - Resets employee search filters', async () => {
        const employee = await pimPage.getFirstEmployee();
        await pimPage.searchByEmployeeId(employee.id);
        await pimPage.resetFilters();

        await expect(pimPage.getInputByLabel('Employee Id')).toHaveValue('');
        await expect(pimPage.employeeNameInput).toHaveValue('');
        await expect(pimPage.recordCount).toBeVisible();
        expect(await pimPage.employeeTable.getByRole('row').count()).toBeGreaterThan(1);
    });

    test('TC015 - Opens an employee personal details page', async ({ page }) => {
        const employee = await pimPage.getFirstEmployee();
        await pimPage.searchByEmployeeId(employee.id);
        await pimPage.openFirstEmployeeDetails();

        await expect(page).toHaveURL(/\/viewPersonalDetails\/empNumber\/\d+$/);
        await expect(page.getByRole('heading', {
            name: 'Personal Details',
            exact: true
        })).toBeVisible();
        await expect(page.getByRole('tab', {
            name: 'Personal Details',
            exact: true
        })).toBeVisible();
    });
});
