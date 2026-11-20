const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS login', () => {
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate(testData.baseUrl);
    });

    test('Loads the login page and shows the sign-in form', async () => {
        await expect(loginPage.welcomeText).toBeVisible();
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
    });

    test('Requires email and password before submitting', async () => {
        await expect(loginPage.emailInput).toHaveAttribute('required', '');
        await expect(loginPage.passwordInput).toHaveAttribute('required', '');
        await loginPage.submit();

        expect(await loginPage.emailInput.evaluate(
            (input) => input.validity.valueMissing
        )).toBe(true);
        expect(await loginPage.passwordInput.evaluate(
            (input) => input.validity.valueMissing
        )).toBe(true);
    });

    test('Rejects an invalid email format with browser validation', async () => {
        await loginPage.emailInput.fill('not-an-email');
        await loginPage.passwordInput.fill('SyntheticInvalidPassword123!');
        await loginPage.submit();

        expect(await loginPage.emailInput.evaluate(
            (input) => input.validity.typeMismatch
        )).toBe(true);
        await expect(loginPage.page).toHaveURL(
            `${testData.baseUrl}/login`
        );
    });

    test('Trims leading and trailing spaces from an email address', async () => {
        await loginPage.emailInput.fill(' user@example.com ');

        await expect(loginPage.emailInput).toHaveValue('user@example.com');
        expect(await loginPage.emailInput.evaluate((input) => input.validity.valid))
            .toBe(true);
        await expect(loginPage.page).toHaveURL(`${testData.baseUrl}/login`);
    });

    test('Allows the Remember me option to be selected and cleared', async () => {
        await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
        await loginPage.rememberMeCheckbox.check();
        await expect(loginPage.rememberMeCheckbox).toBeChecked();
        await loginPage.rememberMeCheckbox.uncheck();
        await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
    });

    test('Shows and masks the password when the visibility control is toggled', async () => {
        await loginPage.passwordInput.fill('SyntheticPasswordForVisibility123!');
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

        await loginPage.togglePasswordVisibility();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

        await loginPage.togglePasswordVisibility();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('Rejects an invalid account without leaving the login page', async ({ page }) => {
        await loginPage.login(
            testData.invalidCredentials.email,
            testData.invalidCredentials.password
        );

        await expect(page).toHaveURL(`${testData.baseUrl}/login`);
        await expect(loginPage.signInButton).toBeVisible();
    });

    test('Keeps password recovery gated by the required email field', async ({ page }) => {
        await expect(loginPage.emailInput).toHaveAttribute('required', '');
        await loginPage.forgotPasswordButton.click();

        expect(await loginPage.emailInput.evaluate(
            (input) => input.validity.valueMissing
        )).toBe(true);
        await expect(page).toHaveURL(`${testData.baseUrl}/login`);
    });

    test('Shows the sign-up entry point', async () => {
        await expect(loginPage.signUpLink).toHaveAttribute('href', '/signup');
        await expect(loginPage.signUpLink).toBeVisible();
    });

    test('Signs in with credentials from the configured environment', async ({ page }) => {
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );

        await expect(page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        })).toBeVisible({ timeout: 20000 });
        await expect(page).toHaveURL(`${testData.baseUrl}/`);
    });
});
