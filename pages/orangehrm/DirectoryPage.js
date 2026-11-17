class DirectoryPage {
    constructor(page) {
        this.page = page;
        this.directoryHeading = page.getByRole('heading', {
            name: 'Directory',
            exact: true
        }).last();
        this.employeeNameInput = page.getByPlaceholder('Type for hints...');
        this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
        this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
        this.employeeCards = page.locator('.orangehrm-directory-card');
        this.recordCount = page.getByText(/\(\d+\) Records? Found/);
    }

    async navigateTo() {
        await this.page.getByRole('link', {
            name: 'Directory',
            exact: true
        }).click();
    }

    async searchByEmployeeName(searchPrefix) {
        await this.employeeNameInput.fill(searchPrefix);
        const matchingEmployees = this.page.getByRole('option')
            .filter({ hasNotText: 'Searching....' })
            .filter({ hasNotText: 'No Records Found' });
        const firstMatchingEmployee = matchingEmployees.first();

        await firstMatchingEmployee.waitFor({
            state: 'visible'
        });
        const employeeName = (await firstMatchingEmployee.innerText()).trim();
        await firstMatchingEmployee.click();
        await this.searchButton.click();
        return employeeName;
    }

    async resetFilters() {
        await this.resetButton.click();
    }

    getEmployeeCard(employeeName) {
        return this.employeeCards.filter({ hasText: employeeName });
    }
}

module.exports = { DirectoryPage };
