import { Locator, Page } from '@playwright/test';

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly quantityField: Locator;
    private readonly addToCartButton: Locator;
    private readonly successMessage: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.quantityField = page.locator('#input-quantity');
        this.addToCartButton = page.getByRole('button', { name: 'Add to Cart', exact: true });
        this.successMessage = page.getByText('Success: You have added', { exact: false });
    }

    /**
     * Checks whether the requested product details are displayed.
     * @param productName - Expected product name
     * @returns Whether the product heading is visible
     */
    async isProductDetailsVisible(productName: string): Promise<boolean> {
        return this.page.getByRole('heading', { name: productName, exact: true }).isVisible();
    }

    /**
     * Reads the product's displayed price.
     * @returns The product price text
     */
    async getProductPrice(): Promise<string> {
        return (await this.page.getByRole('heading', { level: 2, name: /^\$\d/ }).innerText()).trim();
    }

    /**
     * Sets the product quantity before adding it to the cart.
     * @param quantity - Requested quantity
     */
    async setQuantity(quantity: string): Promise<void> {
        await this.quantityField.fill(quantity);
    }

    /**
     * Adds the selected product to the shopping cart.
     */
    async addToCart(): Promise<void> {
        await this.addToCartButton.click();
        await this.successMessage.waitFor({ state: 'visible' });
    }

    /**
     * Checks whether OpenCart confirms that the product was added.
     * @returns Whether the success message is visible
     */
    async isProductAddedVisible(): Promise<boolean> {
        return this.successMessage.isVisible();
    }
}
