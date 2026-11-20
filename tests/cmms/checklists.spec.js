const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { ChecklistsPage } = require('../../pages/cmms/ChecklistsPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS checklists', () => {
    test.describe.configure({ timeout: 90000 });

    let checklistsPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        checklistsPage = new ChecklistsPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        const checklistListResponse = page.waitForResponse((response) =>
            new URL(response.url()).pathname === '/api/getCustomtTaskList'
        );
        await checklistsPage.navigateToChecklists();
        await checklistListResponse;
    });

    test('Displays checklist information, table columns, and first-page controls', async () => {
        await expect(checklistsPage.checklistsHeading).toContainText(/\(\d+\)/);
        await expect(checklistsPage.description).toBeVisible();
        await expect(checklistsPage.checklistsTable).toBeVisible();

        for (const header of ['Name', 'Type', 'Frequency', 'Actions']) {
            await expect(checklistsPage.checklistsTable.getByRole('columnheader', {
                name: header,
                exact: true
            })).toBeVisible();
        }

        await expect(checklistsPage.previousPageButton).toBeDisabled();
        await expect(checklistsPage.itemsPerPageSelector).toBeVisible();
    });

    test('Offers the observed checklist types and returns to All Types', async ({ page }) => {
        await checklistsPage.openTypeFilter();
        await expect(page.getByRole('menuitem', {
            name: /All Types/
        })).toBeVisible();
        for (const type of ['Task Groups', 'Tasks', 'Checklists']) {
            await expect(page.getByRole('menuitem', {
                name: type,
                exact: true
            })).toBeVisible();
        }

        await page.getByRole('menuitem', {
            name: 'Tasks',
            exact: true
        }).click();
        await expect(checklistsPage.typeFilterButton).toHaveText('Tasks');

        await checklistsPage.selectType('All Types');
        await expect(checklistsPage.typeFilterButton).toHaveText('All Types');
    });

    test('Returns no results for a unique query and clears the search', async () => {
        const initialHeading = await checklistsPage.checklistsHeading.innerText();
        await checklistsPage.searchChecklists(`pw-no-match-${Date.now()}`);

        await expect(checklistsPage.checklistsHeading).toHaveText(
            /^Manage all your Maintenance Checklists \(0\)$/
        );
        await expect(checklistsPage.checklistsTable.getByRole('row')).toHaveCount(1);

        await checklistsPage.searchInput.clear();
        await expect(checklistsPage.checklistsHeading).toHaveText(initialHeading);
    });

    test('Opens the task form and validates estimated-time boundaries without submitting', async () => {
        await checklistsPage.openNewTaskForm();
        await expect(checklistsPage.taskTitleInput).toBeVisible();
        await expect(checklistsPage.objectiveInput).toBeVisible();
        await expect(checklistsPage.equipmentTypeInput).toBeVisible();
        await expect(checklistsPage.instructionsInput).toBeVisible();
        await expect(checklistsPage.expectedResultInput).toBeVisible();
        await expect(checklistsPage.alternateActionInput).toBeVisible();

        await expect(checklistsPage.estimatedHoursInput).toHaveAttribute('min', '0');
        await expect(checklistsPage.estimatedHoursInput).toHaveAttribute('max', '999');
        await checklistsPage.estimatedHoursInput.fill('999');
        expect(await checklistsPage.estimatedHoursInput.evaluate(
            (input) => input.validity.valid
        )).toBe(true);

        await checklistsPage.estimatedMinutesInput.fill('60');
        expect(await checklistsPage.estimatedMinutesInput.evaluate(
            (input) => input.validity.rangeOverflow
        )).toBe(true);
        await checklistsPage.estimatedMinutesInput.fill('59');
        expect(await checklistsPage.estimatedMinutesInput.evaluate(
            (input) => input.validity.valid
        )).toBe(true);

        await expect(checklistsPage.addTaskButton).toBeVisible();
    });

    test('Views an existing checklist without changing it', async () => {
        const rowCount = await checklistsPage.checklistsTable.getByRole('row').count();
        test.skip(rowCount <= 1, 'No checklist records are available to inspect.');

        await checklistsPage.openFirstChecklistActions();
        await checklistsPage.page.getByRole('menuitem', {
            name: 'View',
            exact: true
        }).click();

        await expect(checklistsPage.viewDialog.getByRole('heading', {
            name: 'View Checklist',
            exact: true
        })).toBeVisible();
        for (const label of [
            'Title *',
            'Objective',
            'Frequency',
            'Equipment Type',
            'Estimated Hours (HH:MM)',
            'Instructions',
            'Expected Result',
            'Alternate Action (If Failed)'
        ]) {
            await expect(checklistsPage.viewDialog.getByText(label, {
                exact: true
            })).toBeVisible();
        }
        await checklistsPage.viewDialog.getByRole('button', {
            name: 'Close',
            exact: true
        }).last().click();
    });

    test('Opens and cancels an existing checklist edit without saving', async () => {
        const rowCount = await checklistsPage.checklistsTable.getByRole('row').count();
        test.skip(rowCount <= 1, 'No checklist records are available to inspect.');

        await checklistsPage.openFirstChecklistActions();
        await checklistsPage.page.getByRole('menuitem', {
            name: 'Edit',
            exact: true
        }).click();
        await expect(checklistsPage.page.getByRole('heading', {
            name: 'Edit Checklist',
            exact: true
        })).toBeVisible();
        await checklistsPage.cancelButton.click();
        await expect(checklistsPage.checklistsHeading).toBeVisible();
    });
});
