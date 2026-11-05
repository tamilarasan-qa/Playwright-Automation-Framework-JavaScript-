import {test, expect } from '@playwright/test';

test('Flipkart signup Page', async ({ page }) => {
     await page.goto('https://www.flipkart.com/account/login');
});