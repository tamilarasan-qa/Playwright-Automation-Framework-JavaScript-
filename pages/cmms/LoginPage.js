class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.getByLabel('Email Address');
        this.passwordInput = page.getByLabel('Password');
        this.rememberMeCheckbox = page.getByLabel('Remember me');
        this.passwordVisibilityButton = page.locator('#password + button');
        this.signInButton = page.getByRole('button', {
            name: 'Sign In',
            exact: true
        });
        this.forgotPasswordButton = page.getByRole('button', {
            name: 'Forgot password?',
            exact: true
        });
        this.signUpLink = page.getByRole('link', {
            name: 'Sign Up',
            exact: true
        });
        this.welcomeText = page.getByText('Welcome Back', { exact: true });
    }

    async navigate(baseUrl) {
        await this.page.goto(new URL('/login', baseUrl).toString());
    }

    async fillCredentials(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
    }

    async submit() {
        await this.signInButton.click();
    }

    async login(email, password) {
        await this.fillCredentials(email, password);
        await this.submit();
    }

    async togglePasswordVisibility() {
        await this.passwordVisibilityButton.click();
    }
}

module.exports = { LoginPage };
