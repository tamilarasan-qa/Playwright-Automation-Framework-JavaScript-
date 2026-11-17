class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.errorMessage = page.getByRole('alert');
    }

    async navigateToLogin(baseUrl) {
        await this.page.goto(baseUrl);
    }

    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    getRequiredError(fieldName) {
        const fieldInput = fieldName === 'Username'
            ? this.usernameInput
            : this.passwordInput;

        return this.page
            .locator('.oxd-input-group')
            .filter({ has: fieldInput })
            .getByText('Required', { exact: true });
    }
}

module.exports = { LoginPage };
