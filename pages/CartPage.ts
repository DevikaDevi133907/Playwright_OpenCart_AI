import { Locator, Page } from '@playwright/test';

export class CartPage {
    private readonly page: Page;

    // Locators
    private readonly stockWarning: Locator;
    private readonly cartTotalRow: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.stockWarning = page.getByText(
            'Products marked with *** are not available in the desired quantity or not in stock!',
            { exact: true }
        );
        this.cartTotalRow = page.getByRole('row').filter({
            has: page.getByRole('cell', { name: 'Total:', exact: true })
        });
    }

    /**
     * Checks whether the shopping cart page is displayed.
     * @returns Whether the shopping cart heading is visible
     */
    async isShoppingCartVisible(): Promise<boolean> {
        return this.page.getByRole('heading', { name: /^Shopping Cart/ }).isVisible();
    }

    /**
     * Checks whether a product is present in the shopping cart.
     * @param productName - Expected product name
     * @returns Whether the product link is visible in the cart
     */
    async isProductInCart(productName: string): Promise<boolean> {
        return this.getProductRow(productName).isVisible();
    }

    /**
     * Reads the selected product quantity from the cart.
     * @param productName - Product whose quantity should be read
     * @returns The displayed quantity
     */
    async getProductQuantity(productName: string): Promise<string> {
        return this.getProductRow(productName).getByRole('textbox').inputValue();
    }

    /**
     * Reads the selected product's unit price from the cart.
     * @param productName - Product whose price should be read
     * @returns The displayed unit price
     */
    async getProductPrice(productName: string): Promise<string> {
        return (await this.getProductRow(productName).getByRole('cell').nth(4).innerText()).trim();
    }

    /**
     * Reads the applicable cart total.
     * @returns The displayed cart total
     */
    async getCartTotal(): Promise<string> {
        return (await this.cartTotalRow.getByRole('cell').nth(1).innerText()).trim();
    }

    /**
     * Checks whether the cart displays an insufficient-stock warning.
     * @returns Whether the stock warning is visible
     */
    async isStockWarningVisible(): Promise<boolean> {
        return this.stockWarning.isVisible();
    }

    private getProductRow(productName: string): Locator {
        return this.page.getByRole('row').filter({
            has: this.page.getByRole('link', { name: productName, exact: true })
        });
    }
}
