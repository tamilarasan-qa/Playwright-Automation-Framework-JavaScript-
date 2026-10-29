import { expect } from '@playwright/test';

export class FlipkartLoginPage {
  constructor(page) {
    this.page = page;
    this.loginPrompt = page.getByText('Enter your phone number to continue');
    this.phoneNumberInput = page.getByRole('spinbutton', {
      name: 'Phone Number',
    });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async goto() {
    await this.page.goto('https://www.flipkart.com/account/login');
  }

  async expectInitialLoginForm() {
    await expect(this.loginPrompt).toBeVisible();
    await expect(this.phoneNumberInput).toBeVisible();
    await expect(this.continueButton).toBeDisabled();
  }

  async enterPhoneNumber(phoneNumber) {
    await this.phoneNumberInput.fill(phoneNumber);
  }

  async expectContinueEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  async expectContinueDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }
}
