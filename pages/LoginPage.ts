import { Locator, Page } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly emailField: Locator;
    private readonly passwordField: Locator;
    private readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.emailField = page.getByLabel('E-Mail Address');
        this.passwordField = page.getByLabel('Password', { exact: true });
        this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    }

    /**
     * Checks whether the login page is displayed.
     * @returns Whether the login heading is visible
     */
    async isLoginPageVisible(): Promise<boolean> {
        return this.page.getByRole('heading', { name: 'Returning Customer', exact: true }).isVisible();
    }

    /**
     * Signs in using the supplied customer credentials.
     * @param email - Registered customer email
     * @param password - Registered customer password
     */
    async login(email: string, password: string): Promise<void> {
        try {
            await this.emailField.fill(email);
            await this.passwordField.fill(password);
            await this.loginButton.click();
            await this.page.locator('#content').getByRole('heading', { name: 'My Account', exact: true }).waitFor({ state: 'visible' });
        } catch (error) {
            console.error('Customer login failed:', error);
            throw error;
        }
    }
}
