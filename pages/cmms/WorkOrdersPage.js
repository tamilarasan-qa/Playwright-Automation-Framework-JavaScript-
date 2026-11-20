class WorkOrdersPage {
    constructor(page) {
        this.page = page;
        this.workOrdersHeading = page.getByRole('heading', {
            name: /^(All|Work Orders) \(\d+ records\)$/
        });
        this.workOrdersTable = page.getByRole('table');
        this.searchButton = page.locator('button:has(svg.lucide-search)').first();
        this.searchInput = page.getByPlaceholder('Search work orders...');
        this.createWorkOrderButton = page.getByRole('button', {
            name: 'Work Order',
            exact: true
        });
        this.createWorkOrderHeading = page.getByRole('heading', {
            name: 'Create New Work Order',
            exact: true
        });
        this.subjectInput = page.getByPlaceholder('Enter subject');
        this.nextStepButton = page.getByRole('button', {
            name: 'Next',
            exact: true
        });
        this.backToTemplateButton = page.getByRole('button', {
            name: 'Back to Template',
            exact: true
        });
        this.createButton = page.getByRole('button', {
            name: 'Create',
            exact: true
        });
    }

    async navigateToWorkOrders() {
        await this.page.getByRole('button', {
            name: 'Work Orders',
            exact: true
        }).first().click();
        await this.workOrdersHeading.waitFor({ state: 'visible' });
        await this.workOrdersTable.waitFor({ state: 'visible' });
    }

    async openSearch() {
        if (!(await this.searchInput.isVisible())) {
            await this.searchButton.click();
        }
        await this.searchInput.waitFor({ state: 'visible' });
    }

    async searchWorkOrders(query) {
        await this.openSearch();
        await this.searchInput.fill(query);
    }

    async openNewWorkOrderForm() {
        await this.createWorkOrderButton.click();
        await this.createWorkOrderHeading.waitFor({ state: 'visible' });
    }

    async selectTemplate(templateName) {
        const templateCard = this.page.locator('div.rounded-lg.border.cursor-pointer')
            .filter({ hasText: templateName });
        await templateCard.waitFor({ state: 'visible' });
        const templateClasses = await templateCard.getAttribute('class');
        if (!templateClasses.includes('border-blue-500')) {
            await templateCard.click();
            await this.subjectInput.waitFor({ state: 'visible' });
        } else if (!(await this.subjectInput.isVisible())) {
            await this.nextStepButton.click();
            await this.subjectInput.waitFor({ state: 'visible' });
        }
    }

}

module.exports = { WorkOrdersPage };
