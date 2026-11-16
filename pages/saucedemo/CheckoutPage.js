class CheckoutPage {
    constructor(page) {
        this.page = page;
        this.firstNameInput = page.getByRole('textbox', { name: 'First Name' });
        this.lastNameInput = page.getByRole('textbox', { name: 'Last Name' });
        this.postalCodeInput = page.getByRole('textbox', { name: 'Zip/Postal Code' });
        this.errorMessage = page.getByRole('alert');
        this.continueButton = page.getByRole('button', { name: 'Continue' });
        this.finishButton = page.getByRole('button', { name: 'Finish' });
        this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
        this.confirmationHeading = page.getByRole('heading', {
            name: 'Thank you for your order!'
        });
        this.confirmationMessage = page.getByText(
            'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
            { exact: true }
        );
        this.cartLink = page.locator('[data-test="shopping-cart-link"]');
        this.overviewItems = page.locator('.cart_item');
        this.itemTotal = page.locator('.summary_subtotal_label');
        this.tax = page.locator('.summary_tax_label');
        this.orderTotal = page.locator('.summary_total_label');
    }

    async fillInformation({ firstName, lastName, postalCode }) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
    }

    async continueToOverview() {
        await this.continueButton.click();
    }

    async finishCheckout() {
        await this.finishButton.click();
    }
}

module.exports = { CheckoutPage };
