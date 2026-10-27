import { Locator, Page } from '@playwright/test';

export class SearchResultsPage {
    private readonly page: Page;

    // Locators
    private readonly resultsHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.resultsHeading = page.getByRole('heading', { name: /^Search - / });
    }

    /**
     * Checks whether the search results page is displayed.
     * @returns Whether the search results heading is visible
     */
    async isSearchResultsVisible(): Promise<boolean> {
        return this.resultsHeading.isVisible();
    }

    /**
     * Checks whether a matching product is present in the search results.
     * @param productName - Expected product name
     * @returns Whether the product link is visible
     */
    async isProductDisplayed(productName: string): Promise<boolean> {
        return this.page.getByRole('link', { name: productName, exact: true }).first().isVisible();
    }

    /**
     * Opens the matching product's details page.
     * @param productName - Product name to open
     */
    async openProduct(productName: string): Promise<void> {
        await this.page.getByRole('link', { name: productName, exact: true }).first().click();
        await this.page.getByRole('heading', { name: productName, exact: true }).waitFor({ state: 'visible' });
    }
}
