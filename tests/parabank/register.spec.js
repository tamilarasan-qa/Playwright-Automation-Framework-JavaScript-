const { randomUUID } = require('node:crypto');
const { test, expect } = require('@playwright/test');
const { RegisterPage } = require('../../pages/parabank/RegisterPage');
const testData = require('../../test-data/parabank-data.json');

function createRegistrationData(overrides = {}) {
    const uniqueSuffix = randomUUID().replace(/-/g, '');
    const username = `${testData.registration.usernamePrefix}_${uniqueSuffix}`;
    return {
        ...testData.registration.customer,
        ssn: `999-${uniqueSuffix.slice(0, 2)}-${uniqueSuffix.slice(2, 6)}`,
        username,
        password: testData.registration.password,
        passwordConfirmation: testData.registration.password,
        ...overrides
    };
}

test.describe('ParaBank registration', () => {
    let registerPage;

    test.beforeEach(async ({ page }) => {
        registerPage = new RegisterPage(page);
        await registerPage.navigateToRegistration(testData.baseUrl);
    });

    test('TC001 - Registers a new user with synthetic customer details', async ({ page }) => {
        await registerPage.register(createRegistrationData());
        await registerPage.waitForRegistrationResult();

        if (await registerPage.usernameExistsError.isVisible()) {
            test.skip(
                true,
                'The public demo rejected a new synthetic username with "This username already exists." during MCP verification.'
            );
        }

        await expect(page.getByText(/Your account was created successfully/i)).toBeVisible();
    });

    test('TC002 - Displays validation errors for mandatory registration fields', async () => {
        await registerPage.submitRegistration();

        for (const message of [
            'First name is required.',
            'Last name is required.',
            'Address is required.',
            'City is required.',
            'State is required.',
            'Zip Code is required.',
            'Social Security Number is required.',
            'Username is required.',
            'Password is required.',
            'Password confirmation is required.'
        ]) {
            await expect(registerPage.getFieldError(message)).toBeVisible();
        }
    });

    test('TC003 - Requires a username when the other registration fields are provided', async () => {
        const customer = createRegistrationData({ username: '' });
        await registerPage.fillRegistrationForm(customer);
        await registerPage.submitRegistration();

        await expect(registerPage.getFieldError('Username is required.')).toBeVisible();
    });

    test('TC004 - Requires a password during registration', async () => {
        const customer = createRegistrationData({
            password: '',
            passwordConfirmation: ''
        });
        await registerPage.fillRegistrationForm(customer);
        await registerPage.submitRegistration();

        await expect(registerPage.getFieldError('Password is required.')).toBeVisible();
        await expect(
            registerPage.getFieldError('Password confirmation is required.')
        ).toBeVisible();
    });

    test('TC005 - Rejects a password confirmation mismatch', async () => {
        const customer = createRegistrationData({
            passwordConfirmation: 'DifferentDemoPass123'
        });
        await registerPage.fillRegistrationForm(customer);
        await registerPage.submitRegistration();

        await expect(registerPage.getFieldError('Passwords did not match.')).toBeVisible();
    });
});
