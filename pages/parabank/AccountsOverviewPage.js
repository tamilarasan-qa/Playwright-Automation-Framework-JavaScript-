class AccountsOverviewPage {
    constructor(page) {
        this.page = page;
        this.overviewHeading = page.getByRole('heading', {
            name: 'Accounts Overview',
            exact: true
        });
        this.accountLinks = page.locator('a[href*="activity.htm?id="]');
        this.accountDetailsHeading = page.getByRole('heading', {
            name: 'Account Details',
            exact: true
        });
        this.transactionHistoryTable = page.getByRole('table').filter({
            has: page.getByRole('columnheader', { name: 'Transaction', exact: true })
        });
        this.profileFields = {
            firstName: page.locator('[name="customer.firstName"]'),
            lastName: page.locator('[name="customer.lastName"]'),
            street: page.locator('[name="customer.address.street"]'),
            city: page.locator('[name="customer.address.city"]'),
            state: page.locator('[name="customer.address.state"]'),
            zipCode: page.locator('[name="customer.address.zipCode"]'),
            phoneNumber: page.locator('[name="customer.phoneNumber"]')
        };
        this.profileUpdatedMessage = page.getByText('Profile Updated', { exact: true });
    }

    async navigateToOverview() {
        await this.page.getByRole('link', {
            name: 'Accounts Overview',
            exact: true
        }).click();
    }

    async getAccounts() {
        await this.accountLinks.first().waitFor({ state: 'visible' });
        const links = await this.accountLinks.all();
        const accounts = [];

        for (const link of links) {
            const href = await link.getAttribute('href');
            const accountId = href && href.match(/[?&]id=([^&]+)/);
            if (!accountId) {
                continue;
            }

            const row = this.page.getByRole('row').filter({
                hasText: new RegExp(`^${accountId[1]}\\b`)
            });
            const cells = await row.locator('td').allTextContents();
            accounts.push({
                id: accountId[1],
                balance: (cells[1] || '').trim(),
                available: (cells[2] || '').trim()
            });
        }

        return accounts;
    }

    async openAccountDetails(accountId) {
        await this.page.locator(
            `a[href*="activity.htm?id=${accountId}"]`
        ).click();
        await this.accountDetailsHeading.waitFor({ state: 'visible' });
        await this.page.waitForFunction(() => [...document.querySelectorAll('#rightPanel tr')]
            .some((row) =>
                row.cells[0]?.textContent.trim() === 'Account Number:' &&
                row.cells[1]?.textContent.trim().length > 0
            ));
    }

    async getTransactionHistory() {
        await this.transactionHistoryTable.getByRole('columnheader', {
            name: 'Transaction',
            exact: true
        }).waitFor({ state: 'visible' });
        const rows = await this.transactionHistoryTable.getByRole('row').all();
        const transactions = [];

        for (const row of rows.slice(1)) {
            const cells = (await row.getByRole('cell').allTextContents())
                .map((cell) => cell.trim());
            if (cells.length >= 4 && cells[0]) {
                transactions.push({
                    date: cells[0],
                    description: cells[1],
                    debit: cells[2],
                    credit: cells[3]
                });
            }
        }

        return transactions;
    }

    async navigateToCustomerProfile() {
        await this.page.getByRole('link', {
            name: 'Update Contact Info',
            exact: true
        }).click();
    }

    async getCustomerProfile() {
        await this.page.waitForFunction(() => {
            const firstName = document.querySelector('[name="customer.firstName"]');
            return firstName && firstName.value.trim().length > 0;
        });

        const profile = {};
        for (const [fieldName, field] of Object.entries(this.profileFields)) {
            profile[fieldName] = await field.inputValue();
        }
        return profile;
    }

    async updateCustomerProfile(profile) {
        for (const [fieldName, field] of Object.entries(this.profileFields)) {
            if (profile[fieldName] !== undefined) {
                await field.fill(profile[fieldName]);
            }
        }
        await this.page.locator('#rightPanel input[value="Update Profile"]').click();
        await this.profileUpdatedMessage.waitFor({ state: 'visible' });
    }

    async logout() {
        await this.page.getByRole('link', { name: 'Log Out', exact: true }).click();
    }
}

module.exports = { AccountsOverviewPage };
