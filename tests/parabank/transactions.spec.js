const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/parabank/LoginPage');
const { AccountsOverviewPage } = require('../../pages/parabank/AccountsOverviewPage');
const { FindTransactionsPage } = require('../../pages/parabank/FindTransactionsPage');
const testData = require('../../test-data/parabank-data.json');

async function findAccountWithTransaction(accountsPage, excludedAccountIds = []) {
    const accounts = await accountsPage.getAccounts();

    for (const account of accounts) {
        if (excludedAccountIds.includes(account.id)) {
            continue;
        }

        await accountsPage.openAccountDetails(account.id);
        const [transaction] = await accountsPage.getTransactionHistory();
        if (transaction) {
            return { account, transaction };
        }
        await accountsPage.navigateToOverview();
    }

    throw new Error('No account with transaction history was found in the live demo.');
}

function transactionAmount(transaction) {
    const value = transaction.debit || transaction.credit;
    return value.replace(/[$,]/g, '');
}

test.describe('ParaBank transaction history', () => {
    let accountsPage;
    let transactionsPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        accountsPage = new AccountsOverviewPage(page);
        transactionsPage = new FindTransactionsPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );
    });

    test('TC025 - Displays transaction history for a live demo account', async () => {
        const { transaction } = await findAccountWithTransaction(accountsPage);

        expect(transaction.date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        expect(transaction.description).not.toBe('');
    });

    test('TC026 - Searches transactions by an observed transaction date', async () => {
        const { account, transaction } = await findAccountWithTransaction(accountsPage);
        await transactionsPage.navigateToFindTransactions();
        await transactionsPage.searchByDate(transaction.date, account.id);
        const results = await transactionsPage.getTransactionResults();

        expect(results.length).toBeGreaterThan(0);
        expect(results.some((result) => result.date === transaction.date)).toBe(true);
    });

    test('TC027 - Searches transactions by an amount read from account history', async () => {
        const { account, transaction } = await findAccountWithTransaction(accountsPage);
        await transactionsPage.navigateToFindTransactions();
        await transactionsPage.searchByAmount(
            transactionAmount(transaction),
            account.id
        );
        const results = await transactionsPage.getTransactionResults();

        expect(results.length).toBeGreaterThan(0);
        expect(results.some((result) =>
            `${result.debit} ${result.credit}`.includes(transactionAmount(transaction))
        )).toBe(true);
    });

    test('TC028 - Filters transaction search results using the selected account', async () => {
        const first = await findAccountWithTransaction(accountsPage);
        await accountsPage.navigateToOverview();
        const second = await findAccountWithTransaction(
            accountsPage,
            [first.account.id]
        );
        await transactionsPage.navigateToFindTransactions();
        await transactionsPage.searchByDate(second.transaction.date, second.account.id);
        const results = await transactionsPage.getTransactionResults();

        await expect(transactionsPage.accountSelect).toHaveValue(second.account.id);
        expect(results.some((result) =>
            result.date === second.transaction.date
        )).toBe(true);
    });
});
