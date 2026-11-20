import { test, expect } from '@playwright/test';

const ONE_LAKH = 100000;
const RESULT_CARD = 'div[data-component-type="s-search-result"]';
const ACCESSORY_WORDS = /\b(case|cover|protector|tempered|charger|cable|guard|skin|stand|pouch)\b/i;

// Click a result link and return the page that actually shows the PRODUCT (/dp/ or /gp/product/).
// Amazon may open it in a new tab, reuse the same tab, or go through a sponsored-ad redirect
// first, so instead of trusting the first "popup" event we look for the page that lands on a
// product URL.
async function clickAndFollow(page, locator) {
    const context = page.context();
    const pagesBefore = new Set(context.pages());
    const urlBefore = page.url();
    const isProductUrl = (u) => /\/(dp|gp\/product)\//.test(u);

    await locator.click();

    let productPage = null;
    await expect
        .poll(
            () => {
                productPage =
                    context.pages().find(
                        (p) =>
                            !p.isClosed() &&
                            isProductUrl(p.url()) &&
                            // a brand-new tab, or the same tab that has navigated
                            (!pagesBefore.has(p) || (p === page && p.url() !== urlBefore))
                    ) || null;
                return productPage !== null;
            },
            { timeout: 30000, message: 'Product page did not open after clicking the result' }
        )
        .toBe(true);

    await productPage.waitForLoadState('domcontentloaded');
    await productPage.bringToFront();
    return productPage;
}

async function failIfCaptcha(page) {
    const blocked = await page
        .getByText(/enter the characters you see|not a robot|sorry, we just need to make sure/i)
        .first()
        .isVisible()
        .catch(() => false);
    if (blocked) {
        throw new Error('Amazon showed a CAPTCHA / bot check. Run with --headed and solve it, or retry later.');
    }
}

// Search -> open the first matching phone result (never a case/cover/charger).
// If nothing matches `titleRegex`, optionally fall back to `fallbackRegex`.
async function searchAndOpenProduct(page, searchTerm, titleRegex, fallbackRegex = null) {
    const searchBox = page.getByRole('searchbox', { name: 'Search Amazon.in' });
    await expect(searchBox).toBeVisible();
    await searchBox.fill(searchTerm);

    await Promise.all([
        page.waitForURL(/\/s\?|[?&]k=/, { timeout: 20000 }),
        page.getByRole('button', { name: 'Go', exact: true }).click(),
    ]);
    await page.waitForLoadState('domcontentloaded');
    await failIfCaptcha(page);

    await page.locator(RESULT_CARD).first().waitFor({ state: 'visible', timeout: 20000 });

    // Works for both layouts: <a><h2/></a> and <h2><a/></h2>
    const titleLinks = page.locator(`${RESULT_CARD} a:has(h2), ${RESULT_CARD} h2 a`);
    const pick = (regex) =>
        titleLinks.filter({ hasText: regex }).filter({ hasNotText: ACCESSORY_WORDS }).first();

    let target = pick(titleRegex);
    let found = await target.waitFor({ state: 'visible', timeout: 12000 }).then(() => true).catch(() => false);

    if (!found && fallbackRegex) {
        console.warn(`WARNING: nothing matched ${titleRegex} for "${searchTerm}". Falling back to ${fallbackRegex}.`);
        target = pick(fallbackRegex);
        found = await target.waitFor({ state: 'visible', timeout: 12000 }).then(() => true).catch(() => false);
    }

    if (!found) {
        const titles = await page.locator(`${RESULT_CARD} h2`).allInnerTexts();
        console.log(`No match for "${searchTerm}". Titles found:\n` +
            titles.slice(0, 15).map((t, i) => `${i + 1}. ${t.trim()}`).join('\n'));
        throw new Error(`Could not find a result matching ${titleRegex}`);
    }

    console.log(`Opening: ${(await target.innerText()).replace(/\s+/g, ' ').trim().slice(0, 100)}`);
    return await clickAndFollow(page, target);
}

async function getPrice(page) {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#productTitle').first()).toBeVisible({ timeout: 20000 });

    // Visible price ("94,999") lives in .a-price-whole; .a-offscreen can be an empty " ".
    // Main price box first so we never read a sponsored/related-product price.
    const selectors = [
        '#corePriceDisplay_desktop_feature_div .priceToPay .a-price-whole',
        '#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
        '#corePrice_feature_div .priceToPay .a-price-whole',
        '#corePrice_feature_div .priceToPay .a-offscreen',
        '#corePrice_feature_div .a-price .a-price-whole',
        '#apex_desktop .priceToPay .a-price-whole',
        '#apex_desktop .a-price .a-price-whole',
        '#apex_desktop .priceToPay .a-offscreen',
        '#buybox .a-price .a-price-whole',
        '#buybox .a-price .a-offscreen',
        '#price_inside_buybox',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
    ];

    let priceText = '';
    await expect
        .poll(
            async () => {
                for (const sel of selectors) {
                    const texts = await page.locator(sel).allTextContents();
                    const hit = texts.find((t) => /\d/.test(t));
                    if (hit) {
                        priceText = hit;
                        return true;
                    }
                }
                return false;
            },
            { timeout: 20000, message: 'No price with digits found on the product page' }
        )
        .toBe(true);

    // "94,999" / "₹1,29,999.00" -> number
    const price = Math.floor(Number(priceText.replace(/[^\d.]/g, '')));
    expect(
        Number.isFinite(price) && price > 0,
        `Could not read a valid price from "${priceText}"`
    ).toBeTruthy();
    return price;
}

async function addToCart(page) {
    const addBtn = page
        .getByRole('button', { name: /add to cart/i })
        .or(page.locator('#add-to-cart-button'))
        .first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    // Confirm it really was added
    await expect(
        page.locator('#NATC_SMART_WAGON_CONF_MSG_SUCCESS, #huc-v2-order-row-confirm-text, #sw-atc-confirmation')
            .or(page.getByText(/added to cart/i))
            .first()
    ).toBeVisible({ timeout: 15000 });
}

test('Amazon mobile price check and add to cart', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Navigate to Amazon
    await page.goto('https://www.amazon.in/', { waitUntil: 'domcontentloaded' });
    await failIfCaptcha(page);

    // 2. Click on Mobiles
    await page.getByRole('link', { name: 'Mobiles', exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // 3 & 4. Search Samsung S25 Ultra 5G and open the Samsung S25 result
    //        (prefers "S25 Ultra", falls back to any "Galaxy S25")
    let activePage = await searchAndOpenProduct(
        page,
        'samsung s25 ultra 5g mobile',
        /S25 Ultra/i,
        /Galaxy S25/i
    );

    const s25Price = await getPrice(activePage);
    console.log(`Samsung S25 price: ₹${s25Price}`);

    if (s25Price < ONE_LAKH) {
        // 5. Less than 1 lakh -> search S22 and add it to cart
        //    (S22 is often not listed any more; falls back to the first Galaxy phone result)
        activePage = await searchAndOpenProduct(
            activePage,
            'Samsung s22',
            /Galaxy S22(?!\s*(Ultra|\+|Plus))/i,
            /Galaxy/i
        );
        await addToCart(activePage);
    } else {
        // 6. 1 lakh or more -> add the S25 to cart
        await addToCart(activePage);
    }
});