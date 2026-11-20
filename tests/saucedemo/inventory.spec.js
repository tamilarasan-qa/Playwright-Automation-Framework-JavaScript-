const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/saucedemo/LoginPage');
const { InventoryPage } = require('../../pages/saucedemo/InventoryPage');
const testData = require('../../test-data/saucedemo-data.json');

test.describe('SauceDemo inventory', () => {
    test.describe.configure({ timeout: 60000 });

    let inventoryPage;
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        await loginPage.open(testData.baseUrl);
        await loginPage.login(
            testData.users.standard.username,
            testData.users.standard.password
        );
    });

    test('TC006 - Displays all inventory products', async () => {
        await expect(inventoryPage.productCards).toHaveCount(testData.products.length);

        for (const product of testData.products) {
            await expect(inventoryPage.getProductName(product.name)).toBeVisible();
        }
    });

    test('TC007 - Shows the expected product names and prices', async () => {
        for (const product of testData.products) {
            await expect(inventoryPage.getProductName(product.name)).toBeVisible();
            await expect(inventoryPage.getProductPrice(product.name)).toHaveText(
                `$${product.price.toFixed(2)}`
            );
        }
    });

    test('TC008 - Sorts products by price from low to high', async () => {
        await inventoryPage.sortProducts(testData.sortOptions.priceLowToHigh);

        const prices = (await inventoryPage.getDisplayedPrices())
            .map((price) => Number(price.replace('$', '')));
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    test('TC009 - Sorts products by price from high to low', async () => {
        await inventoryPage.sortProducts(testData.sortOptions.priceHighToLow);

        const prices = (await inventoryPage.getDisplayedPrices())
            .map((price) => Number(price.replace('$', '')));
        expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    test('TC010 - Adds one product to the cart', async () => {
        const product = testData.products[0];
        await inventoryPage.addProductToCart(product.name);

        await expect(inventoryPage.cartBadge).toHaveText('1');
        await expect(
            inventoryPage.getProductCard(product.name).getByRole('button', { name: 'Remove' })
        ).toBeVisible();
    });

    test('TC011 - Adds multiple products to the cart', async () => {
        const products = [testData.products[0], testData.products[4]];

        for (const product of products) {
            await inventoryPage.addProductToCart(product.name);
        }

        await expect(inventoryPage.cartBadge).toHaveText(String(products.length));
    });

    test('TC023 - Logs out from the inventory', async ({ page }) => {
        await inventoryPage.logout();

        await expect(page).toHaveURL(testData.baseUrl);
        await expect(loginPage.loginButton).toBeVisible();
    });

    test('TC024 - Redirects to login when inventory is opened after logout', async ({ page }) => {
        await inventoryPage.logout();
        await inventoryPage.openDirectly(testData.inventoryUrl);

        await expect(page).toHaveURL(testData.baseUrl);
        await expect(loginPage.loginButton).toBeVisible();
        await expect(inventoryPage.productCards).toHaveCount(0);
    });
});
