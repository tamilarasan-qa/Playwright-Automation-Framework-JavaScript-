class InventoryPage {
    constructor(page) {
        this.page = page;
        this.productCards = page.locator('.inventory_item');
        this.productPrices = page.locator('.inventory_item_price');
        this.sortDropdown = page.getByRole('combobox', { name: 'Sort products' });
        this.productsHeading = page.getByText('Products', { exact: true });
        this.cartLink = page.locator('[data-test="shopping-cart-link"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
        this.menuButton = page.getByRole('button', { name: 'Open Menu' });
        this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
    }

    getProductCard(productName) {
        return this.productCards.filter({
            has: this.page.getByText(productName, { exact: true })
        });
    }

    getProductName(productName) {
        return this.getProductCard(productName).locator('.inventory_item_name');
    }

    getProductPrice(productName) {
        return this.getProductCard(productName).locator('.inventory_item_price');
    }

    async getDisplayedPrices() {
        return this.productPrices.allTextContents();
    }

    async addProductToCart(productName) {
        await this.getProductCard(productName)
            .getByRole('button', { name: 'Add to cart' })
            .click();
    }

    async sortProducts(optionValue) {
        await this.sortDropdown.selectOption(optionValue);
    }

    async openCart() {
        await this.cartLink.click();
    }

    async logout() {
        await this.menuButton.click();
        await this.logoutLink.click();
    }

    async openDirectly(url) {
        await this.page.goto(url);
    }
}

module.exports = { InventoryPage };
