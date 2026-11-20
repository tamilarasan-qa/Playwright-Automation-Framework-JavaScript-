class DashboardPage {
    constructor(page) {
        this.page = page;
        this.dashboardHeading = page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        });
        this.needsAttentionHeading = page.getByRole('heading', {
            name: 'Needs Attention',
            exact: true
        });
        this.plantPerformanceHeading = page.getByRole('heading', {
            name: 'Plant Performance',
            exact: true
        });
        this.plantHealthHeading = page.getByRole('heading', {
            name: 'Plant Health KPIs',
            exact: true
        });
        this.facilitySelector = page.getByRole('combobox').first();
        this.dateRangeButton = page.locator(
            'button[aria-haspopup="dialog"]:has(svg.lucide-calendar)'
        );
        this.refreshButton = page.locator(
            'button:has(svg.lucide-refresh-cw)'
        ).first();
        this.chartContainers = page.locator('.recharts-wrapper');
    }

    async navigateToDashboard() {
        await this.page.getByRole('button', {
            name: 'Dashboard',
            exact: true
        }).first().click();
        await this.dashboardHeading.waitFor({ state: 'visible' });
    }

    async openFacilityOptions() {
        await this.facilitySelector.click();
        return this.page.getByRole('option');
    }

    async selectFacilityOption(index) {
        const options = await this.openFacilityOptions();
        await options.nth(index).click();
    }

    async openDateRangeOptions() {
        await this.dateRangeButton.click();
    }

    async selectDateRange(rangeName) {
        await this.openDateRangeOptions();
        await this.page.getByRole('dialog').getByRole('button', {
            name: rangeName,
            exact: true
        }).click();
    }

    async refreshDashboard() {
        await this.refreshButton.click();
        await this.dashboardHeading.waitFor({ state: 'visible' });
    }
}

module.exports = { DashboardPage };
