const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { MetersPage } = require('../../pages/cmms/MetersPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS meters', () => {
    test.describe.configure({ timeout: 90000 });

    let metersPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        metersPage = new MetersPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        await metersPage.navigateToMeters();
    });

    test('Displays meter records and the observed table columns', async () => {
        await expect(metersPage.metersHeading).toContainText(/\d+ records/);
        await expect(metersPage.metersTable).toBeVisible();

        for (const header of [
            'Name',
            'Sl.No',
            'Type',
            'Model Number',
            'Location',
            'Facility',
            'Actions'
        ]) {
            await expect(metersPage.metersTable.getByRole('columnheader', {
                name: header,
                exact: true
            })).toBeVisible();
        }
    });

    test('Searches for an unknown meter and restores the listing when cleared', async () => {
        await metersPage.searchMeters(`pw-no-match-${Date.now()}`);

        await expect(metersPage.metersTable.getByRole('row')).toHaveCount(1);

        await metersPage.searchInput.clear();
        await expect(metersPage.searchInput).toHaveValue('');
        await expect(metersPage.metersHeading).toContainText(/\d+ records/);
    });

    test('Shows conditional settings for each data-collection mode without saving', async () => {
        await metersPage.openNewMeterForm();
        await expect(metersPage.meterNameInput).toBeVisible();
        await expect(metersPage.manualOption).toBeChecked();
        await expect(metersPage.dataCollectionGroup).toBeVisible();
        await expect(metersPage.gatewayLabel).toBeHidden();
        await expect(metersPage.tagNameLabel).toBeHidden();

        await metersPage.iotOption.check();
        await expect(metersPage.gatewayLabel).toBeVisible();
        await expect(metersPage.tagNameLabel).toBeVisible();

        await metersPage.apiOption.check();
        await expect(metersPage.gatewayLabel).toBeHidden();
        await expect(metersPage.tagNameLabel).toBeHidden();
        await expect(metersPage.page.getByRole('button', {
            name: 'Save',
            exact: true
        })).toBeVisible();
    });
});
