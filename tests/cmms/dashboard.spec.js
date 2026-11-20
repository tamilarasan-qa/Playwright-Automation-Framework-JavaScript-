const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/cmms/LoginPage');
const { DashboardPage } = require('../../pages/cmms/DashboardPage');
const testData = require('../../test-data/cmms/cmms-test-data');

test.describe('CMMS dashboard', () => {
    let dashboardPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await loginPage.navigate(testData.baseUrl);
        await loginPage.login(
            testData.credentials.email,
            testData.credentials.password
        );
        await expect(dashboardPage.dashboardHeading).toBeVisible({
            timeout: 20000
        });
    });

    test('Displays dashboard sections and plant health KPIs', async () => {
        await expect(dashboardPage.needsAttentionHeading).toBeVisible();
        await expect(dashboardPage.plantPerformanceHeading).toBeVisible();
        await expect(dashboardPage.plantHealthHeading).toBeVisible();

        for (const label of [
            'WO Backlog',
            'Critical Breakdowns',
            'Overdue PMs',
            'Repeat Failures',
            'Critical Spares',
            'Availability',
            'Unplanned DT',
            'MTTR',
            'MTBF',
            'PM Compliance'
        ]) {
            await expect(dashboardPage.page.getByText(label, {
                exact: false
            }).first()).toBeVisible();
        }
    });

    test('Provides facility options and applies a different selection', async () => {
        const selector = dashboardPage.facilitySelector;
        const initialSelection = (await selector.innerText()).trim();
        const options = await dashboardPage.openFacilityOptions();
        const optionCount = await options.count();

        expect(optionCount).toBeGreaterThan(0);

        let alternativeIndex = -1;
        for (let index = 0; index < optionCount; index++) {
            if ((await options.nth(index).innerText()).trim() !== initialSelection) {
                alternativeIndex = index;
                break;
            }
        }

        expect(alternativeIndex).toBeGreaterThanOrEqual(0);
        await options.nth(alternativeIndex).click();
        expect((await selector.innerText()).trim() !== initialSelection).toBe(true);
        await expect(dashboardPage.dashboardHeading).toBeVisible();
    });

    test('Offers the observed date ranges and allows changing the range', async () => {
        await dashboardPage.openDateRangeOptions();

        for (const rangeName of [
            'Today',
            'Today (including Overdue)',
            'This Week',
            'This Month',
            '3 Months',
            'Custom Range'
        ]) {
            await expect(dashboardPage.page.getByRole('dialog').getByRole('button', {
                name: rangeName,
                exact: true
            })).toBeVisible();
        }

        await dashboardPage.page.getByRole('dialog').getByRole('button', {
            name: 'This Week',
            exact: true
        }).click();
        await dashboardPage.page.keyboard.press('Escape');
        await expect(dashboardPage.dateRangeButton).toContainText('This Week');
    });

    test('Loads dashboard charts and refreshes the current view', async () => {
        await expect(dashboardPage.chartContainers.first()).toBeVisible();
        // expect(await dashboardPage.chartContainers.count()).toBeGreaterThan(0);

        await dashboardPage.refreshDashboard();
        await expect(dashboardPage.dashboardHeading).toBeVisible();
    });
});
