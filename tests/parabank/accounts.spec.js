const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/parabank/LoginPage');
const { AccountsOverviewPage } = require('../../pages/parabank/AccountsOverviewPage');
const testData = require('../../test-data/parabank-data.json');

test.describe('ParaBank accounts and customer profile', () => {
    let accountsPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        accountsPage = new AccountsOverviewPage(page);
        await loginPage.navigateToLogin(testData.baseUrl);
        await loginPage.login(
            testData.users.demo.username,
            testData.users.demo.password
        );
    });

    test('TC011 - Displays the account overview page', async () => {
        await expect(accountsPage.overviewHeading).toBeVisible();
    });

    test('TC012 - Lists accounts and their live balance values', async () => {
        const accounts = await accountsPage.getAccounts();

        expect(accounts.length).toBeGreaterThan(0);
        for (const account of accounts) {
            expect(account.id).not.toBe('');
            expect(account.balance).toMatch(/^-?\$[\d,]+\.\d{2}$/);
            expect(account.available).toMatch(/^\$[\d,]+\.\d{2}$/);
        }
    });

    test('TC013 - Opens account details for an account discovered in the overview', async ({ page }) => {
        const [account] = await accountsPage.getAccounts();
        await accountsPage.openAccountDetails(account.id);

        await expect(accountsPage.accountDetailsHeading).toBeVisible();
        await expect(page.getByRole('cell', { name: account.id, exact: true })).toBeVisible();
    });

    test('TC014 - Shows the live account balance in overview and account details', async ({ page }) => {
        const [account] = await accountsPage.getAccounts();
        await accountsPage.openAccountDetails(account.id);

        const balanceRow = page.getByRole('row').filter({ hasText: 'Balance:' });
        await expect(balanceRow).toContainText(account.balance);
    });

    test('TC015 - Provides navigation to account services', async ({ page }) => {
        for (const linkName of [
            'Transfer Funds',
            'Bill Pay',
            'Find Transactions',
            'Update Contact Info'
        ]) {
            await expect(page.getByRole('link', {
                name: linkName,
                exact: true
            })).toBeVisible();
        }
    });

    test('TC029 - Displays the customer profile form with current customer details', async ({ page }) => {
        await accountsPage.navigateToCustomerProfile();

        await expect(page.getByRole('heading', {
            name: 'Update Profile',
            exact: true
        })).toBeVisible();
        const profile = await accountsPage.getCustomerProfile();
        expect(Object.values(profile).every((value) => value.length > 0)).toBe(true);
    });

    test.describe('Customer profile updates', () => {
        test.describe.configure({ mode: 'serial' });

        test('TC030 - Updates customer information and restores the shared demo profile', async ({ page }) => {
            test.skip(
                true,
                'The demo has no isolated test account: registration rejects unique users and profile updates persist on the shared john account.'
            );
        });

        test('TC031 - Verifies updated profile details persist and restores the shared demo profile', async ({ page }) => {
            test.skip(
                true,
                'The demo has no isolated test account: registration rejects unique users and profile updates persist on the shared john account.'
            );
        });
    });
});
