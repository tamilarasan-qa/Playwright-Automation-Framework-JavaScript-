const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/parabank/LoginPage');
const { AccountsOverviewPage } = require('../../pages/parabank/AccountsOverviewPage');
const { BillPayPage } = require('../../pages/parabank/BillPayPage');
const testData = require('../../test-data/parabank-data.json');

async function getBillPaySource(accountsPage, billPayPage, sourceIndex) {
    await accountsPage.navigateToOverview();
    const accounts = await accountsPage.getAccounts();
    const eligibleAccounts = accounts.filter((account) => {
        const available = Number(account.available.replace(/[$,]/g, ''));
        return available >= testData.accountSelection.minimumAvailableForDemoTransaction;
    });

    if (eligibleAccounts.length <= sourceIndex) {
        throw new Error('The live demo does not expose enough funded accounts for this bill payment test.');
    }

    await billPayPage.navigateToBillPay();
    return eligibleAccounts[sourceIndex];
}

test.describe('ParaBank bill payments', () => {
    let accountsPage;
    let billPayPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        accountsPage = new AccountsOverviewPage(page);
        billPayPage = new BillPayPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );
        await billPayPage.navigateToBillPay();
    });

    test('TC021 - Pays a synthetic utility bill from a live demo account', async ({ page }) => {
        const source = await getBillPaySource(accountsPage, billPayPage, 2);
        await billPayPage.payBill(
            testData.billPayment.payee,
            testData.billPayment.amount,
            source.id
        );
        await billPayPage.waitForPaymentResult();

        if (await billPayPage.serverError.isVisible()) {
            test.skip(
                true,
                'The public demo returned an internal error for a valid synthetic bill payment.'
            );
        }

        await expect(billPayPage.paymentConfirmation).toBeVisible();
        await expect(page.locator('#rightPanel')).toContainText(
            testData.billPayment.payee.name
        );
    });

    test('TC022 - Confirms the bill payment amount and recipient', async ({ page }) => {
        const source = await getBillPaySource(accountsPage, billPayPage, 3);
        await billPayPage.payBill(
            testData.billPayment.payee,
            testData.billPayment.amount,
            source.id
        );
        await billPayPage.waitForPaymentResult();

        if (await billPayPage.serverError.isVisible()) {
            test.skip(
                true,
                'The public demo returned an internal error for a valid synthetic bill payment.'
            );
        }

        await expect(billPayPage.paymentConfirmation).toBeVisible();
        await expect(page.locator('#rightPanel')).toContainText(
            testData.billPayment.payee.name
        );
        await expect(page.locator('#rightPanel')).toContainText(
            testData.billPayment.amount
        );
    });

    test('TC023 - Keeps the bill payment form open when required details are missing', async ({ page }) => {
        await billPayPage.submitBillPayment();

        await expect(page.getByRole('heading', {
            name: 'Bill Payment Service',
            exact: true
        })).toBeVisible();
        await expect(billPayPage.paymentConfirmation).not.toBeVisible();
        await expect(billPayPage.payeeFields.name).toHaveValue('');
        await expect(billPayPage.amountInput).toHaveValue('');
    });

    test('TC024 - Retains the synthetic recipient and amount in the bill payment form', async () => {
        const source = await getBillPaySource(accountsPage, billPayPage, 0);
        await billPayPage.fillBillPaymentForm(
            testData.billPayment.payee,
            testData.billPayment.amount,
            source.id
        );

        await expect(billPayPage.payeeFields.name).toHaveValue(
            testData.billPayment.payee.name
        );
        await expect(billPayPage.amountInput).toHaveValue(
            testData.billPayment.amount
        );
        await expect(billPayPage.fromAccountSelect).toHaveValue(source.id);
    });
});
