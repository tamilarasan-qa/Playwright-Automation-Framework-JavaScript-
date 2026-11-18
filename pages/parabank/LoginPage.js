class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('form[action*="login"] input[name="username"]');
        this.passwordInput = page.locator('form[action*="login"] input[name="password"]');
        this.loginButton = page.locator('form[action*="login"] input[type="submit"]');
        this.errorMessage = page.locator('#rightPanel .error');
        this.logoutLink = page.getByRole('link', { name: 'Log Out', exact: true });
    }

    async navigateToLogin(baseUrl) {
        await this.page.goto(baseUrl);
    }

    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async logout() {
        await this.logoutLink.click();
    }
}

module.exports = { LoginPage };
