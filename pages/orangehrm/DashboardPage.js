class DashboardPage {
    constructor(page) {
        this.page = page;
        this.dashboardHeading = page.getByRole('heading', {
            name: 'Dashboard',
            exact: true
        });
        this.userProfileButton = page.locator('.oxd-userdropdown-tab');
        this.logoutMenuItem = page.getByRole('menuitem', {
            name: 'Logout',
            exact: true
        });
        this.widgetTitles = [
            'Time at Work',
            'My Actions',
            'Quick Launch',
            'Buzz Latest Posts',
            'Employees on Leave Today',
            'Employee Distribution by Sub Unit',
            'Employee Distribution by Location'
        ].map(title => page.getByText(title, { exact: true }));
    }

    async navigateToModule(moduleName) {
        await this.page.getByRole('link', {
            name: moduleName,
            exact: true
        }).click();
    }

    async openUserProfileMenu() {
        await this.userProfileButton.click();
    }

    async logout() {
        await this.openUserProfileMenu();
        await this.logoutMenuItem.click();
    }
}

module.exports = { DashboardPage };
