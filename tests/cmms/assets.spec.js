const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { AssetsPage } = require('../../pages/cmms/AssetsPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS assets', () => {
    test.describe.configure({ timeout: 120000 });

    let assetsPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        assetsPage = new AssetsPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(page.getByRole('heading', {
            name: 'TamidaS CMMS Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        await assetsPage.navigateToAssets();
    });

    test('Displays asset records, live total, and listing headers', async () => {
        await expect(assetsPage.assetsHeading).toContainText(/\d+ assets/);
        await expect(assetsPage.assetTable).toBeVisible();

        for (const header of [
            'Name',
            'Location',
            'Facility',
            'Category',
            'QR Code',
            'Actions'
        ]) {
            await expect(assetsPage.assetTable.getByRole('columnheader', {
                name: header,
                exact: true
            })).toBeVisible();
        }

        expect(await assetsPage.assetTable.getByRole('row').count())
            .toBeGreaterThan(1);
    });

    test('Searches for an asset and displays the empty result state for an unknown query', async ({ page }) => {
        const query = `pw-no-match-${Date.now()}`;
        await assetsPage.searchAssets(query);

        await expect(page.getByText(/no assets|no results|no records/i).first())
            .toBeVisible();
    });

    test('Opens the column chooser and lists available asset columns', async ({ page }) => {
        await assetsPage.openColumnChooser();

        for (const column of [
            'Name',
            'Location',
            'Facility',
            'Category',
            'QR Code',
            'Next Maintenance',
            'Serial Number'
        ]) {
            await expect(page.getByText(column, { exact: true }).last())
                .toBeVisible();
        }
    });

    test('Navigates the asset wizard and retains basic details when returning', async ({ page }) => {
        await assetsPage.openNewAssetForm();
        const asset = testData.createSyntheticAssetData();

        await expect(assetsPage.assetNameInput).toBeVisible();
        await expect(assetsPage.facilitySelector).toBeVisible();
        await assetsPage.fillBasicDetails(asset);
        await assetsPage.selectFirstFacility();
        await assetsPage.continueToNextStep();

        await expect(page.getByText('Purchase Price', {
            exact: true
        })).toBeVisible();
        await assetsPage.returnToPreviousStep();
        await expect(assetsPage.assetNameInput).toHaveValue(asset.name);

        await assetsPage.continueToNextStep();
        await expect(page.getByText('Purchase Date', {
            exact: true
        })).toBeVisible();
        await assetsPage.continueToNextStep();
        await expect(page.getByText('Last Service Date', {
            exact: true
        })).toBeVisible();
        await assetsPage.continueToNextStep();
        await expect(page.getByText('Upload', {
            exact: true
        }).first()).toBeVisible();
        await assetsPage.continueToNextStep();
        await expect(assetsPage.createAssetButton).toBeVisible();
    });

    test('Opens an existing asset edit form without saving changes', async () => {
        await assetsPage.openFirstAssetDetails();
        await assetsPage.openAssetEditForm();

        await expect(assetsPage.updateAssetButton).toBeVisible();
        await expect(assetsPage.cancelEditButton).toBeVisible();
        await assetsPage.cancelAssetEdit();
    });

});

test('Creates, updates, and deletes a synthetic asset', async () => {
    test.skip(
        true,
        'The loaded row action menu exposes Edit and QR Code only; creating a persistent record without a verified cleanup path is unsafe.'
    );
});
