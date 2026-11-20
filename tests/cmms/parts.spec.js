const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { PartsPage } = require('../../pages/cmms/PartsPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS parts', () => {
    test.describe.configure({ timeout: 90000 });

    let partsPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        partsPage = new PartsPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        await partsPage.navigateToParts();
    });

    test('Displays the parts listing, columns, and page-size choices', async ({ page }) => {
        await expect(partsPage.partsHeading).toContainText(/\d+ records/);
        await expect(partsPage.partsTable).toBeVisible();

        for (const header of [
            '#Part',
            'Name',
            'Facility',
            'Store/Part Location',
            'Available',
            'Min. Count',
            'Cost/Unit',
            'Actions'
        ]) {
            await expect(partsPage.partsTable.getByRole('columnheader', {
                name: header,
                exact: true
            })).toBeVisible();
        }

        await partsPage.itemsPerPageSelector.click();
        for (const size of ['25', '50', '75', '100']) {
            await expect(page.getByRole('option', {
                name: size,
                exact: true
            })).toBeVisible();
        }
        await page.keyboard.press('Escape');
    });

    test('Searches for an unknown part and restores the listing when cleared', async () => {
        const initialHeading = await partsPage.partsHeading.innerText();
        await partsPage.searchParts(`pw-no-match-${Date.now()}`);

        await expect(partsPage.partsHeading).toHaveText(/^Parts \(0 records\)$/);
        await expect(partsPage.partsTable.getByRole('row')).toHaveCount(1);

        await partsPage.searchInput.clear();
        await expect(partsPage.partsHeading).toHaveText(initialHeading);
    });

    test('Opens the filters panel', async () => {
        await partsPage.openFilters();
        await expect(partsPage.addFilterButton).toBeVisible();
    });

    test('Lists available columns in the column chooser', async ({ page }) => {
        await partsPage.openColumnChooser();
        for (const column of [
            '#Part',
            'Name',
            'Facility',
            'Store/Part Location',
            'Available',
            'Min. Count',
            'Cost/Unit'
        ]) {
            await expect(page.getByRole('checkbox', {
                name: column,
                exact: true
            })).toBeVisible();
        }
        await expect(page.getByRole('button', {
            name: 'Apply Changes',
            exact: true
        })).toBeVisible();
    });

    test('Moves through the unsaved part wizard and checks the count boundary', async () => {
        await partsPage.openNewPartForm();
        await expect(partsPage.partNameInput).toBeVisible();

        await partsPage.countInput.fill('0');
        expect(await partsPage.countInput.evaluate(
            (input) => input.validity.rangeUnderflow
        )).toBe(true);
        await partsPage.countInput.fill('1');
        expect(await partsPage.countInput.evaluate(
            (input) => input.validity.valid
        )).toBe(true);

        await partsPage.navigateToManufacturerStep();
        await expect(partsPage.batchCodeInput).toBeVisible();
        await expect(partsPage.qrCodeInput).toBeVisible();

        await partsPage.nextStepButton.click();
        await expect(partsPage.facilitySelector).toBeVisible();
        await expect(partsPage.createPartButton).toBeVisible();
    });
});
