class PIMPage {
    constructor(page) {
        this.page = page;
        this.employeeInformationHeading = page.getByRole('heading', {
            name: 'Employee Information',
            exact: true
        });
        this.employeeNameInput = page.getByPlaceholder('Type for hints...').first();
        this.employeeTable = page.getByRole('table');
        this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
        this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
        this.recordCount = page.getByText(/\(\d+\) Records? Found/);
    }

    async navigateTo() {
        await this.page.getByRole('link', { name: 'PIM', exact: true }).click();
    }

    getInputByLabel(label) {
        return this.page
            .locator('.oxd-input-group')
            .filter({ has: this.page.getByText(label, { exact: true }) })
            .getByRole('textbox');
    }

    async getFirstEmployee() {
        await this.employeeTable.getByRole('row').nth(1).waitFor({
            state: 'visible'
        });
        const cells = await this.employeeTable
            .getByRole('row')
            .nth(1)
            .getByRole('cell')
            .allTextContents();
        const employee = {
            id: cells[1] ? cells[1].trim() : '',
            name: [cells[2], cells[3]]
                .filter(Boolean)
                .map(value => value.trim())
                .filter(Boolean)
                .join(' ')
        };

        if (!employee.id || !employee.name) {
            throw new Error('The first employee row did not contain an ID and name.');
        }

        return employee;
    }

    async searchByName(employeeName) {
        await this.employeeNameInput.fill(employeeName);
        await this.page.getByRole('option', {
            name: employeeName,
            exact: true
        }).first().click();
        await this.searchButton.click();
    }

    async searchByEmployeeId(employeeId) {
        await this.getInputByLabel('Employee Id').fill(employeeId);
        await this.searchButton.click();
    }

    async resetFilters() {
        await this.resetButton.click();
    }

    getEmployeeRows() {
        return this.employeeTable.getByRole('rowgroup').nth(1).getByRole('row');
    }

    async openFirstEmployeeDetails() {
        await this.getEmployeeRows().first().click();
    }
}

module.exports = { PIMPage };
