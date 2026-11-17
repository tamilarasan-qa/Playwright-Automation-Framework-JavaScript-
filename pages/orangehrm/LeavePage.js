class LeavePage {
    constructor(page) {
        this.page = page;
        this.leaveListHeading = page.getByRole('heading', {
            name: 'Leave List',
            exact: true
        });
        this.leaveTable = page.getByRole('table');
        this.fromDateInput = page.getByPlaceholder('yyyy-dd-mm').first();
        this.employeeNameInput = page.getByPlaceholder('Type for hints...');
        this.noRecordsMessage = page.getByText('No Records Found', { exact: true });
        this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
        this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
    }

    async navigateTo() {
        await this.page.getByRole('link', { name: 'Leave', exact: true }).click();
    }

    getFilterGroup(label) {
        return this.page.locator('.oxd-input-group').filter({ hasText: label });
    }

    async searchByEmployeeName(employeeName) {
        await this.employeeNameInput.fill(employeeName);
        await this.searchButton.click();
    }

    async resetFilters() {
        await this.resetButton.click();
    }

    getResultRows() {
        return this.leaveTable.getByRole('rowgroup').nth(1).getByRole('row');
    }
}

module.exports = { LeavePage };
