const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/parabank/LoginPage');
const { AccountsOverviewPage } = require('../../pages/parabank/AccountsOverviewPage');
const { TransferFundsPage } = require('../../pages/parabank/TransferFundsPage');
const testData = require('../../test-data/parabank-data.json');

async function getTransferAccounts(accountsPage, transferPage, sourceIndex) {
    await accountsPage.navigateToOverview();
    const accounts = await accountsPage.getAccounts();
    const eligibleAccounts = accounts.filter((account) => {
        const available = Number(account.available.replace(/[$,]/g, ''));
        return available >= testData.accountSelection.minimumAvailableForDemoTransaction;
    });

    if (eligibleAccounts.length < sourceIndex + 1 || eligibleAccounts.length < 2) {
        throw new Error('The live demo does not expose enough funded accounts for this transfer test.');
    }

    const source = eligibleAccounts[sourceIndex];
    const destination = eligibleAccounts.find((account) => account.id !== source.id);
    await transferPage.navigateToTransferFunds();
    return { source, destination };
}

test.describe('ParaBank fund transfers', () => {
    let accountsPage;
    let transferPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        accountsPage = new AccountsOverviewPage(page);
        transferPage = new TransferFundsPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );
        await transferPage.navigateToTransferFunds();
    });

    test('TC016 - Transfers a small amount between live demo accounts and verifies the debit', async ({ page }) => {
        const { source, destination } = await getTransferAccounts(
            accountsPage,
            transferPage,
            0
        );
        await accountsPage.navigateToOverview();
        await accountsPage.openAccountDetails(source.id);
        const previousTransactions = await accountsPage.getTransactionHistory();

        await transferPage.navigateToTransferFunds();
        await transferPage.transferFunds(
            testData.transfer.amount,
            source.id,
            destination.id
        );

        await expect(transferPage.transferConfirmation).toBeVisible();
        await accountsPage.navigateToOverview();
        await accountsPage.openAccountDetails(source.id);
        const transactions = await accountsPage.getTransactionHistory();
        const expectedDebit = `$${Number(testData.transfer.amount).toFixed(2)}`;
        expect(transactions.length).toBeGreaterThan(previousTransactions.length);
        expect(transactions.some((transaction) =>
            transaction.description.includes('Funds Transfer Sent') &&
            transaction.debit === expectedDebit
        )).toBe(true);
    });

    test('TC017 - Confirms a transfer and reports the submitted amount', async ({ page }) => {
        const { source, destination } = await getTransferAccounts(
            accountsPage,
            transferPage,
            1
        );
        await transferPage.transferFunds(
            testData.transfer.amount,
            source.id,
            destination.id
        );

        await expect(transferPage.transferConfirmation).toBeVisible();
        await expect(page.locator('#rightPanel')).toContainText(testData.transfer.amount);
    });

    test('TC018 - Rejects a non-numeric transfer amount without confirming a transfer', async () => {
        const { source, destination } = await getTransferAccounts(
            accountsPage,
            transferPage,
            0
        );
        await transferPage.transferFunds(
            testData.transfer.invalidAmount,
            source.id,
            destination.id
        );

        await expect(transferPage.transferConfirmation).not.toBeVisible();
    });

    test('TC019 - Rejects a transfer with a missing amount', async () => {
        const { source, destination } = await getTransferAccounts(
            accountsPage,
            transferPage,
            0
        );
        await transferPage.fillTransferForm(undefined, source.id, destination.id);
        await transferPage.submitTransfer();

        await expect(transferPage.transferConfirmation).not.toBeVisible();
    });

    test('TC020 - Retains the selected source and destination accounts', async () => {
        const { source, destination } = await getTransferAccounts(
            accountsPage,
            transferPage,
            0
        );
        await transferPage.fillTransferForm(
            testData.transfer.amount,
            source.id,
            destination.id
        );

        await expect(transferPage.fromAccountSelect).toHaveValue(source.id);
        await expect(transferPage.toAccountSelect).toHaveValue(destination.id);
    });
});
