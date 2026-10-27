import { Locator, Page } from '@playwright/test';

export type CustomerRegistration = {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
};

export class RegisterPage {
    private readonly page: Page;

    // Locators
    private readonly firstNameField: Locator;
    private readonly lastNameField: Locator;
    private readonly emailField: Locator;
    private readonly telephoneField: Locator;
    private readonly passwordField: Locator;
    private readonly confirmPasswordField: Locator;
    private readonly privacyPolicyCheckbox: Locator;
    private readonly continueButton: Locator;
    private readonly createdHeading: Locator;
    private readonly confirmationContinueLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.firstNameField = page.getByLabel('First Name');
        this.lastNameField = page.getByLabel('Last Name');
        this.emailField = page.getByLabel('E-Mail');
        this.telephoneField = page.getByLabel('Telephone');
        this.passwordField = page.getByLabel('Password', { exact: true });
        this.confirmPasswordField = page.getByLabel('Password Confirm');
        this.privacyPolicyCheckbox = page.getByRole('checkbox');
        this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        this.createdHeading = page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true });
        this.confirmationContinueLink = page.getByRole('link', { name: 'Continue', exact: true });
    }

    /**
     * Checks whether the registration page is displayed.
     * @returns Whether the registration heading is visible
     */
    async isRegistrationPageVisible(): Promise<boolean> {
        return this.page.getByRole('heading', { name: 'Register Account', exact: true }).isVisible();
    }

    /**
     * Completes and submits the customer registration form.
     * @param customer - Customer details for the new account
     */
    async register(customer: CustomerRegistration): Promise<void> {
        try {
            await this.firstNameField.fill(customer.firstName);
            await this.lastNameField.fill(customer.lastName);
            await this.emailField.fill(customer.email);
            await this.telephoneField.fill(customer.telephone);
            await this.passwordField.fill(customer.password);
            await this.confirmPasswordField.fill(customer.password);
            await this.privacyPolicyCheckbox.check();
            await this.continueButton.click();
            await this.createdHeading.waitFor({ state: 'visible' });
        } catch (error) {
            console.error('Customer registration failed:', error);
            throw error;
        }
    }

    /**
     * Checks whether the account-created confirmation is displayed.
     * @returns Whether the confirmation heading is visible
     */
    async isAccountCreatedVisible(): Promise<boolean> {
        return this.createdHeading.isVisible();
    }

    /**
     * Continues from account creation to the authenticated account area.
     */
    async continueToAccount(): Promise<void> {
        await this.confirmationContinueLink.click();
        await this.page.locator('#content').getByRole('heading', { name: 'My Account', exact: true }).waitFor({ state: 'visible' });
    }
}
