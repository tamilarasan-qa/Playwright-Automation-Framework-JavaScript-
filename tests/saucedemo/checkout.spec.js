const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/saucedemo/LoginPage');
const { InventoryPage } = require('../../pages/saucedemo/InventoryPage');
const { CartPage } = require('../../pages/saucedemo/CartPage');
const { CheckoutPage } = require('../../pages/saucedemo/CheckoutPage');
const testData = require('../../test-data/saucedemo-data.json');

test.describe('SauceDemo checkout', () => {
    test.describe.configure({ timeout: 60000 });

    let checkoutPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);

        await loginPage.open(testData.baseUrl);
        await loginPage.login(
            testData.users.standard.username,
            testData.users.standard.password
        );
        await inventoryPage.addProductToCart(testData.products[0].name);
        await inventoryPage.openCart();
        await cartPage.proceedToCheckout();
    });

    test('TC017 - Opens the checkout information step', async ({ page }) => {
        await expect(page).toHaveURL(/checkout-step-one\.html$/);
        await expect(checkoutPage.firstNameInput).toBeVisible();
        await expect(checkoutPage.lastNameInput).toBeVisible();
        await expect(checkoutPage.postalCodeInput).toBeVisible();
    });

    test('TC018 - Requires a first name', async () => {
        await checkoutPage.fillInformation({
            firstName: '',
            lastName: testData.checkout.lastName,
            postalCode: testData.checkout.postalCode
        });
        await checkoutPage.continueToOverview();

        await expect(checkoutPage.errorMessage).toContainText('Error: First Name is required');
    });

    test('TC019 - Requires a last name', async () => {
        await checkoutPage.fillInformation({
            firstName: testData.checkout.firstName,
            lastName: '',
            postalCode: testData.checkout.postalCode
        });
        await checkoutPage.continueToOverview();

        await expect(checkoutPage.errorMessage).toContainText('Error: Last Name is required');
    });

    test('TC020 - Requires a postal code', async () => {
        await checkoutPage.fillInformation({
            firstName: testData.checkout.firstName,
            lastName: testData.checkout.lastName,
            postalCode: ''
        });
        await checkoutPage.continueToOverview();

        await expect(checkoutPage.errorMessage).toContainText('Error: Postal Code is required');
    });

    test('TC021 - Completes checkout and verifies the order summary', async ({ page }) => {
        await checkoutPage.fillInformation({
            firstName: testData.checkout.firstName,
            lastName: testData.checkout.lastName,
            postalCode: testData.checkout.postalCode
        });
        await checkoutPage.continueToOverview();

        await expect(checkoutPage.overviewItems).toHaveCount(1);
        await expect(checkoutPage.itemTotal).toHaveText(testData.checkout.itemTotal);
        await expect(checkoutPage.tax).toHaveText(testData.checkout.tax);
        await expect(checkoutPage.orderTotal).toHaveText(testData.checkout.total);

        await checkoutPage.finishCheckout();
        await expect(page).toHaveURL(/checkout-complete\.html$/);
    });

    test('TC022 - Displays the order confirmation after checkout', async () => {
        await checkoutPage.fillInformation({
            firstName: testData.checkout.firstName,
            lastName: testData.checkout.lastName,
            postalCode: testData.checkout.postalCode
        });
        await checkoutPage.continueToOverview();
        await checkoutPage.finishCheckout();

        await expect(checkoutPage.confirmationHeading).toBeVisible();
        await expect(checkoutPage.confirmationMessage).toBeVisible();
        await expect(checkoutPage.cartLink).toHaveAttribute('aria-label', 'Cart, empty');
        await expect(checkoutPage.backHomeButton).toBeVisible();
    });
});
