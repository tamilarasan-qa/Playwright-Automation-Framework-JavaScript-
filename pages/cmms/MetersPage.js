class MetersPage {
    constructor(page) {
        this.page = page;
        this.metersHeading = page.getByRole('heading', {
            name: /^Meters \(\d+ records\)$/
        });
        this.metersTable = page.getByRole('table');
        this.searchButton = page.locator('button:has(svg.lucide-search)').first();
        this.searchInput = page.getByPlaceholder('Search meters...');
        this.addMeterButton = page.getByRole('button', {
            name: 'Meter',
            exact: true
        });
        this.addMeterHeading = page.getByRole('heading', {
            name: 'Add Meter',
            exact: true
        });
        this.meterNameInput = page.getByPlaceholder('Enter meter name');
        this.dataCollectionGroup = page.getByRole('radiogroup');
        this.manualOption = page.getByRole('radio', {
            name: 'Manual',
            exact: true
        });
        this.iotOption = page.getByRole('radio', {
            name: 'IoT Based',
            exact: true
        });
        this.apiOption = page.getByRole('radio', {
            name: 'API Based',
            exact: true
        });
        this.gatewayLabel = page.getByText('Gateway *', { exact: true });
        this.tagNameLabel = page.getByText('Tag Name *', { exact: true });
        this.itemsPerPageSelector = page.getByRole('combobox').last();
    }

    async navigateToMeters() {
        await this.page.getByRole('button', {
            name: 'Meters',
            exact: true
        }).first().click();
        await this.metersHeading.waitFor({ state: 'visible' });
        await this.metersTable.waitFor({ state: 'visible' });
    }

    async openSearch() {
        if (!(await this.searchInput.isVisible())) {
            await this.searchButton.click();
        }
        await this.searchInput.waitFor({ state: 'visible' });
    }

    async searchMeters(query) {
        await this.openSearch();
        await this.searchInput.fill(query);
    }

    async openNewMeterForm() {
        await this.addMeterButton.click();
        await this.addMeterHeading.waitFor({ state: 'visible' });
    }
}

module.exports = { MetersPage };
