class RegisterPage {
    constructor(page) {
        this.page = page;
        this.customerFields = {
            firstName: page.locator('[name="customer.firstName"]'),
            lastName: page.locator('[name="customer.lastName"]'),
            street: page.locator('[name="customer.address.street"]'),
            city: page.locator('[name="customer.address.city"]'),
            state: page.locator('[name="customer.address.state"]'),
            zipCode: page.locator('[name="customer.address.zipCode"]'),
            phoneNumber: page.locator('[name="customer.phoneNumber"]'),
            ssn: page.locator('[name="customer.ssn"]'),
            username: page.locator('[name="customer.username"]'),
            password: page.locator('[name="customer.password"]'),
            passwordConfirmation: page.locator('[name="repeatedPassword"]')
        };
        this.registerButton = page.locator('#rightPanel input[value="Register"]');
        this.fieldErrors = page.locator('#rightPanel .error');
        this.usernameExistsError = page.getByText(
            'This username already exists.',
            { exact: true }
        );
    }

    async navigateToRegistration(baseUrl) {
        await this.page.goto(baseUrl);
        await this.page.getByRole('link', { name: 'Register', exact: true }).click();
    }

    async fillRegistrationForm(customer) {
        const values = {
            firstName: customer.firstName,
            lastName: customer.lastName,
            street: customer.street,
            city: customer.city,
            state: customer.state,
            zipCode: customer.zipCode,
            phoneNumber: customer.phoneNumber,
            ssn: customer.ssn,
            username: customer.username,
            password: customer.password,
            passwordConfirmation: customer.passwordConfirmation
        };

        for (const [fieldName, value] of Object.entries(values)) {
            if (value !== undefined) {
                await this.customerFields[fieldName].fill(value);
            }
        }
    }

    async submitRegistration() {
        await this.registerButton.click();
    }

    async register(customer) {
        await this.fillRegistrationForm(customer);
        await this.submitRegistration();
    }

    async waitForRegistrationResult() {
        await this.page.waitForFunction(() => {
            const panelText = document.querySelector('#rightPanel')?.innerText || '';
            const usernameExists = [...document.querySelectorAll('#rightPanel .error')]
                .some((error) =>
                    error.textContent.trim() === 'This username already exists.'
                );
            return usernameExists ||
                panelText.includes('Your account was created successfully');
        });
    }

    getFieldError(message) {
        return this.page.getByText(message, { exact: true });
    }
}

module.exports = { RegisterPage };
