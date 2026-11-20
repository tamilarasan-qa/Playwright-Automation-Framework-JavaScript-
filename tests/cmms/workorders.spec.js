const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { WorkOrdersPage } = require('../../pages/cmms/WorkOrdersPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS work orders', () => {
    let workOrdersPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        workOrdersPage = new WorkOrdersPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(page.getByRole('heading', {
            name: 'TamidaS CMMS Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        await workOrdersPage.navigateToWorkOrders();
    });

    test('Displays the work order list and observed columns', async () => {
        await expect(workOrdersPage.workOrdersHeading).toContainText(/\d+ records/);

        for (const header of [
            '#WO',
            'Subject',
            'Asset',
            'Status',
            'Assigned To',
            'Supervisor',
            'WO Category',
            '#WR'
        ]) {
            await expect(workOrdersPage.workOrdersTable.getByRole('columnheader', {
                name: header,
                exact: true
            })).toBeVisible();
        }
    });

    test('Opens work order search and accepts a synthetic query', async () => {
        const query = `pw-no-match-${Date.now()}`;
        await workOrdersPage.searchWorkOrders(query);

        await expect(workOrdersPage.searchInput).toHaveValue(query);
    });

    test('Shows the observed templates and opens the Quick Work Order form', async ({ page }) => {
        await workOrdersPage.openNewWorkOrderForm();

        for (const template of [
            'Quick Work Order',
            'Standard Work Order',
            'Full Work Order'
        ]) {
            await expect(page.getByText(template, { exact: true })).toBeVisible();
        }

        await workOrdersPage.selectTemplate('Quick Work Order');
        await expect(workOrdersPage.subjectInput).toBeVisible();
        await expect(page.getByText('Priority', { exact: true }).last())
            .toBeVisible();
        await expect(page.getByText('Due Date', { exact: true }).last())
            .toBeVisible();
        await expect(workOrdersPage.createButton).toBeVisible();
    });

    test('Exposes the Back to Template control in the Quick Work Order form', async () => {
        await workOrdersPage.openNewWorkOrderForm();
        await workOrdersPage.selectTemplate('Quick Work Order');

        await expect(workOrdersPage.backToTemplateButton).toBeVisible();
    });

    test('Displays the full template work order fields', async ({ page }) => {
        await workOrdersPage.openNewWorkOrderForm();
        await workOrdersPage.selectTemplate('Full Work Order');

        for (const field of [
            'Subject *',
            'WO Category',
            'Priority',
            'Due Date',
            'Assignees',
            'Supervisors'
        ]) {
            await expect(page.getByText(field, { exact: true }).last())
                .toBeVisible();
        }
        await expect(page.getByRole('button', {
            name: 'Select Assets',
            exact: true
        })).toBeVisible();
    });
});

test('Creates and deletes a synthetic work order', async () => {
    test.skip(
        true,
        'The submit flow requires facility/asset context, but the inspected facility selector exposed no selectable options; a create/delete cycle could not be verified safely.'
    );
});
