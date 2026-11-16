const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/saucedemo/LoginPage');
const { InventoryPage } = require('../../pages/saucedemo/InventoryPage');
const { CartPage } = require('../../pages/saucedemo/CartPage');
const testData = require('../../test-data/saucedemo-data.json');

test.describe('SauceDemo cart', () => {
    test.describe.configure({ timeout: 60000 });

    let cartPage;
    let inventoryPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);

        await loginPage.open(testData.baseUrl);
        await loginPage.login(
            testData.users.standard.username,
            testData.users.standard.password
        );
        await inventoryPage.addProductToCart(testData.products[0].name);
        await inventoryPage.addProductToCart(testData.products[4].name);
        await inventoryPage.openCart();
    });

    test('TC012 - Shows the selected products in the cart', async () => {
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.getCartItem(testData.products[0].name)).toBeVisible();
        await expect(cartPage.getCartItem(testData.products[4].name)).toBeVisible();
    });

    test('TC013 - Removes a product from the cart', async () => {
        await cartPage.removeProduct(testData.products[4].name);

        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(cartPage.getCartItem(testData.products[4].name)).toHaveCount(0);
        await expect(cartPage.getCartItem(testData.products[0].name)).toBeVisible();
    });

    test('TC014 - Keeps the cart badge count in sync with cart items', async () => {
        await expect(inventoryPage.cartBadge).toHaveText('2');
        await expect(cartPage.cartItems).toHaveCount(2);

        await cartPage.removeProduct(testData.products[0].name);

        await expect(inventoryPage.cartBadge).toHaveText('1');
        await expect(cartPage.cartItems).toHaveCount(1);
    });

    test('TC015 - Continues shopping from the cart', async ({ page }) => {
        await cartPage.continueShopping();

        await expect(page).toHaveURL(/inventory\.html$/);
        await expect(inventoryPage.productsHeading).toBeVisible();
    });

    test('TC016 - Preserves cart products while navigating to inventory and back', async ({ page }) => {
        await cartPage.continueShopping();
        await expect(inventoryPage.cartBadge).toHaveText('2');

        await inventoryPage.openCart();

        await expect(page).toHaveURL(/cart\.html$/);
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.getCartItem(testData.products[0].name)).toBeVisible();
        await expect(cartPage.getCartItem(testData.products[4].name)).toBeVisible();
    });
});
