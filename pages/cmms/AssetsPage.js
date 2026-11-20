class AssetsPage {
    constructor(page) {
        this.page = page;
        this.assetsHeading = page.getByRole('heading', {
            name: /^All \(\d+ assets/
        });
        this.assetTable = page.getByRole('table');
        this.searchButton = page.locator('button:has(svg.lucide-search)').first();
        this.searchInput = page.getByPlaceholder(
            'Search name, QR, serial no., facility, location...'
        );
        this.chooseColumnsButton = page.locator(
            'button:has(svg.lucide-columns2)'
        ).first();
        this.filterButton = page.locator('button:has(svg.lucide-filter)').first();
        this.addAssetButton = page.getByRole('button', {
            name: 'Asset',
            exact: true
        });
        this.createAssetHeading = page.getByRole('heading', {
            name: 'Create New Asset',
            exact: true
        });
        this.assetNameInput = page.getByLabel('Asset Name *');
        this.categoryButton = page.getByRole('button', {
            name: 'Select category',
            exact: true
        });
        this.parentAssetButton = page.getByRole('button', {
            name: 'Select parent asset',
            exact: true
        });
        this.facilitySelector = page.locator(
            'label[for="facId"] + button[role="combobox"]'
        );
        this.locationButton = page.getByRole('button', {
            name: 'Select Location',
            exact: true
        });
        this.assetTypeButton = page.getByRole('button', {
            name: 'Select types',
            exact: true
        });
        this.serialNumberInput = page.getByLabel('Serial Number');
        this.qrCodeInput = page.getByPlaceholder('Enter QR code');
        this.descriptionInput = page.getByLabel('Description');
        this.nextStepButton = page.getByRole('button', {
            name: 'Next',
            exact: true
        });
        this.previousStepButton = page.getByRole('button', {
            name: 'Previous',
            exact: true
        });
        this.createAssetButton = page.getByRole('button', {
            name: 'Create Asset',
            exact: true
        });
        this.updateAssetButton = page.getByRole('button', {
            name: 'Update',
            exact: true
        });
        this.cancelEditButton = page.getByRole('button', {
            name: 'Cancel',
            exact: true
        });
    }

    async navigateToAssets() {
        await this.page.getByRole('button', {
            name: 'Assets',
            exact: true
        }).first().click();
        await this.waitForAssetRows();
    }

    async waitForAssetRows() {
        await this.page.waitForFunction(() =>
            [...document.querySelectorAll('table tbody tr td:nth-child(2)')]
                .some((cell) => cell.textContent.trim().length > 0)
        );
    }

    async openSearch() {
        if (!(await this.searchInput.isVisible())) {
            await this.searchButton.click();
        }
        await this.searchInput.waitFor({ state: 'visible' });
    }

    async searchAssets(query) {
        await this.openSearch();
        await this.searchInput.fill(query);
    }

    async openColumnChooser() {
        await this.chooseColumnsButton.click();
        await this.page.getByRole('heading', {
            name: 'Choose Columns',
            exact: true
        }).waitFor({ state: 'visible' });
    }

    async openFilterControls() {
        await this.filterButton.click();
    }

    async openNewAssetForm() {
        await this.addAssetButton.click();
        await this.createAssetHeading.waitFor({ state: 'visible' });
    }

    async selectFirstFacility() {
        await this.facilitySelector.click();
        const firstOption = this.page.getByRole('option').first();
        await firstOption.waitFor({ state: 'visible' });
        await firstOption.click();
    }

    async fillBasicDetails(asset) {
        await this.assetNameInput.fill(asset.name);
        await this.serialNumberInput.fill(asset.serialNumber);
        await this.qrCodeInput.fill(asset.qrCode);
        await this.descriptionInput.fill(asset.description);
    }

    async continueToNextStep() {
        await this.nextStepButton.click();
    }

    async returnToPreviousStep() {
        await this.previousStepButton.click();
    }

    async openFirstAssetDetails() {
        await this.assetTable.getByRole('row').nth(1)
            .getByRole('cell').nth(1).click();
    }

    async openAssetEditForm() {
        await this.page.getByRole('button', {
            name: 'Edit',
            exact: true
        }).click();
    }

    async cancelAssetEdit() {
        await this.cancelEditButton.click();
    }
}

module.exports = { AssetsPage };
