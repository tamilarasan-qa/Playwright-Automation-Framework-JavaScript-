class FindTransactionsPage {
    constructor(page) {
        this.page = page;
        this.accountSelect = page.locator('#accountId');
        this.transactionIdInput = page.locator('#transactionId');
        this.transactionDateInput = page.locator('#transactionDate');
        this.fromDateInput = page.locator('#fromDate');
        this.toDateInput = page.locator('#toDate');
        this.amountInput = page.locator('#amount');
        this.findByIdButton = page.locator('#findById');
        this.findByDateButton = page.locator('#findByDate');
        this.findByDateRangeButton = page.locator('#findByDateRange');
        this.findByAmountButton = page.locator('#findByAmount');
        this.transactionResultsTable = page.getByRole('table').filter({
            has: page.getByRole('columnheader', { name: 'Date', exact: true })
        });
    }

    async navigateToFindTransactions() {
        await this.page.getByRole('link', {
            name: 'Find Transactions',
            exact: true
        }).click();
    }

    async selectAccount(accountId) {
        await this.accountSelect.selectOption(accountId);
    }

    async searchByTransactionId(transactionId, accountId) {
        await this.selectAccount(accountId);
        await this.transactionIdInput.fill(transactionId);
        await this.findByIdButton.click();
    }

    async searchByDate(date, accountId) {
        await this.selectAccount(accountId);
        await this.transactionDateInput.fill(date);
        await this.findByDateButton.click();
    }

    async searchByDateRange(fromDate, toDate, accountId) {
        await this.selectAccount(accountId);
        await this.fromDateInput.fill(fromDate);
        await this.toDateInput.fill(toDate);
        await this.findByDateRangeButton.click();
    }

    async searchByAmount(amount, accountId) {
        await this.selectAccount(accountId);
        await this.amountInput.fill(amount);
        await this.findByAmountButton.click();
    }

    async getTransactionResults() {
        await this.transactionResultsTable.waitFor({ state: 'visible' });
        const rows = await this.transactionResultsTable.getByRole('row').all();
        const results = [];

        for (const row of rows.slice(1)) {
            const cells = (await row.getByRole('cell').allTextContents())
                .map((cell) => cell.trim());
            if (cells.length >= 4 && cells[0]) {
                results.push({
                    date: cells[0],
                    description: cells[1],
                    debit: cells[2],
                    credit: cells[3]
                });
            }
        }

        return results;
    }
}

module.exports = { FindTransactionsPage };
