import { Locator, Page } from '@playwright/test';

export class AccountPage {
    private readonly page: Page;

    // Locators
    private readonly dashboardHeading: Locator;
    private readonly logoutHeading: Locator;
    private readonly continueLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.dashboardHeading = page.locator('#content').getByRole('heading', { name: 'My Account', exact: true });
        this.logoutHeading = page.getByRole('heading', { name: 'Account Logout', exact: true });
        this.continueLink = page.locator('#content').getByRole('link', { name: 'Continue', exact: true });
    }

    /**
     * Checks whether the authenticated account dashboard is displayed.
     * @returns Whether the dashboard heading is visible
     */
    async isDashboardVisible(): Promise<boolean> {
        return this.dashboardHeading.isVisible();
    }

    /**
     * Checks whether the logout confirmation page is displayed.
     * @returns Whether the logout heading is visible
     */
    async isLogoutConfirmationVisible(): Promise<boolean> {
        return this.logoutHeading.isVisible();
    }

    /**
     * Continues from the logout confirmation page.
     */
    async continueAfterLogout(): Promise<void> {
        await this.continueLink.click();
    }
}
