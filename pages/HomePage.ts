import { Locator, Page } from '@playwright/test';

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly accountMenu: Locator;
    private readonly registerLink: Locator;
    private readonly loginLink: Locator;
    private readonly logoutLink: Locator;
    private readonly searchField: Locator;
    private readonly shoppingCartLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.accountMenu = page.locator('#top-links').getByRole('link', { name: 'My Account' });
        this.registerLink = page.locator('#top-links .dropdown-menu').getByRole('link', { name: 'Register', exact: true });
        this.loginLink = page.locator('#top-links .dropdown-menu').getByRole('link', { name: 'Login', exact: true });
        this.logoutLink = page.locator('#top-links .dropdown-menu').getByRole('link', { name: 'Logout', exact: true });
        this.searchField = page.getByRole('textbox', { name: 'Search' });
        this.shoppingCartLink = page.locator('#top-links').getByRole('link', { name: 'Shopping Cart' });
    }

    /**
     * Opens the account navigation menu.
     */
    async openAccountMenu(): Promise<void> {
        await this.accountMenu.click();
    }

    /**
     * Opens the customer registration page.
     */
    async openRegistration(): Promise<void> {
        await this.openAccountMenu();
        await this.registerLink.click();
        await this.page.getByRole('heading', { name: 'Register Account', exact: true }).waitFor({ state: 'visible' });
    }

    /**
     * Opens the customer login page.
     */
    async openLogin(): Promise<void> {
        await this.openAccountMenu();
        await this.loginLink.click();
        await this.page.getByRole('heading', { name: 'Returning Customer', exact: true }).waitFor({ state: 'visible' });
    }

    /**
     * Logs out the currently authenticated customer.
     */
    async logout(): Promise<void> {
        await this.openAccountMenu();
        await this.logoutLink.click();
        await this.page.getByRole('heading', { name: 'Account Logout', exact: true }).waitFor({ state: 'visible' });
    }

    /**
     * Searches for a product by name.
     * @param productName - Product name to search for
     */
    async searchProduct(productName: string): Promise<void> {
        await this.searchField.fill(productName);
        await this.searchField.press('Enter');
        await this.page.waitForURL('**route=product/search**');
    }

    /**
     * Opens the shopping cart.
     */
    async openShoppingCart(): Promise<void> {
        await this.shoppingCartLink.click();
    }
}
