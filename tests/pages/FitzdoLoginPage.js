import { expect } from '@playwright/test';

export class FitzdoLoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Enter your email');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.passwordInput = page.getByRole('textbox', {
      name: 'Enter Your Password',
    });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.successHeading = page.getByRole('heading', {
      name: 'Tell us about your business',
    });
  }

  async goto(url) {
    await this.page.goto(url);
  }

  async login(username, password) {
    await this.emailInput.fill(username);
    await this.continueButton.click();
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectAuthenticated() {
    await expect(this.page).toHaveURL(/\/auth\/business-category\/?$/);
    await expect(this.successHeading).toBeVisible();
  }
}