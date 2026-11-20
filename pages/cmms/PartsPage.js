class PartsPage {
    constructor(page) {
        this.page = page;
        this.partsHeading = page.getByRole('heading', {
            name: /^Parts \(\d+ records\)$/
        });
        this.partsTable = page.getByRole('table');
        this.searchButton = page.locator('button:has(svg.lucide-search)').first();
        this.searchInput = page.getByPlaceholder('Search parts...');
        this.chooseColumnsButton = page.locator(
            'button:has(svg.lucide-columns2)'
        ).first();
        this.filterButton = page.locator('button:has(svg.lucide-filter)').first();
        this.filtersHeading = page.getByRole('heading', {
            name: 'Filters',
            exact: true
        });
        this.addFilterButton = page.getByRole('button', {
            name: 'Add filter',
            exact: true
        });
        this.chooseColumnsHeading = page.getByRole('heading', {
            name: 'Choose Columns',
            exact: true
        });
        this.addPartButton = page.getByRole('button', {
            name: 'Part',
            exact: true
        });
        this.addPartHeading = page.getByRole('heading', {
            name: 'Add New Part',
            exact: true
        });
        this.partNameInput = page.getByPlaceholder('Enter part name');
        this.categoryInput = page.getByLabel('Category', { exact: true });
        this.typeInput = page.getByPlaceholder('Enter type');
        this.countInput = page.getByRole('spinbutton', {
            name: 'Count',
            exact: true
        });
        this.thresholdCountInput = page.getByRole('spinbutton', {
            name: 'Threshold Count',
            exact: true
        });
        this.costPerPieceInput = page.getByRole('spinbutton', {
            name: 'Cost Per Piece',
            exact: true
        });
        this.nextStepButton = page.getByRole('button', {
            name: 'Next',
            exact: true
        });
        this.batchCodeInput = page.getByPlaceholder('Enter batchId');
        this.qrCodeInput = page.getByPlaceholder('Enter QR Code');
        this.createPartButton = page.getByRole('button', {
            name: 'Create Part',
            exact: true
        });
        this.facilitySelector = page.getByRole('combobox').last();
        this.itemsPerPageSelector = page.getByRole('combobox').last();
        this.previousPageButton = page.getByRole('button', {
            name: 'Previous',
            exact: true
        });
        this.nextPageButton = page.getByRole('button', {
            name: 'Next',
            exact: true
        });
    }

    async navigateToParts() {
        await this.page.getByRole('button', {
            name: 'Parts',
            exact: true
        }).first().click();
        await this.partsHeading.waitFor({ state: 'visible' });
        await this.partsTable.waitFor({ state: 'visible' });
    }

    async openSearch() {
        if (!(await this.searchInput.isVisible())) {
            await this.searchButton.click();
        }
        await this.searchInput.waitFor({ state: 'visible' });
    }

    async searchParts(query) {
        await this.openSearch();
        await this.searchInput.fill(query);
    }

    async openFilters() {
        await this.filterButton.click();
        await this.filtersHeading.waitFor({ state: 'visible' });
    }

    async openColumnChooser() {
        await this.chooseColumnsButton.click();
        await this.chooseColumnsHeading.waitFor({ state: 'visible' });
    }

    async openNewPartForm() {
        await this.addPartButton.click();
        await this.addPartHeading.waitFor({ state: 'visible' });
    }

    async navigateToManufacturerStep() {
        await this.partNameInput.fill(`pw-inspection-part-${Date.now()}`);
        await this.categoryInput.fill('Synthetic test category');
        await this.typeInput.fill('Synthetic test type');
        await this.countInput.fill('1');
        await this.thresholdCountInput.fill('0');
        await this.costPerPieceInput.fill('0');
        await this.nextStepButton.click();
        await this.batchCodeInput.waitFor({ state: 'visible' });
    }
}

module.exports = { PartsPage };
