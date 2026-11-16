class CartPage {
    constructor(page) {
        this.page = page;
        this.cartItems = page.locator('.cart_item');
        this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
        this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    }

    getCartItem(productName) {
        return this.cartItems.filter({
            has: this.page.getByText(productName, { exact: true })
        });
    }

    async removeProduct(productName) {
        await this.getCartItem(productName)
            .getByRole('button', { name: 'Remove' })
            .click();
    }

    async continueShopping() {
        await this.continueShoppingButton.click();
    }

    async proceedToCheckout() {
        await this.checkoutButton.click();
    }
}

module.exports = { CartPage };
