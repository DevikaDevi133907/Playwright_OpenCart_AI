# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: web\end-to-end-shopping-flow.spec.ts >> Complete customer shopping journey @master @sanity @regression @web @end-to-end
- Location: tests\web\end-to-end-shopping-flow.spec.ts:17:5

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByRole('row').filter({ has: getByRole('link', { name: 'MacBook Air', exact: true }) }).getByRole('link', { name: 'MacBook Air', exact: true }) resolved to 2 elements:
    1) <a href="https://awesomeqa.com/ui/index.php?route=product/product&product_id=44">…</a> aka getByRole('link', { name: 'MacBook Air' }).first()
    2) <a href="https://awesomeqa.com/ui/index.php?route=product/product&product_id=44">MacBook Air</a> aka locator('#content').getByText('MacBook Air')

Call log:
    - checking visibility of getByRole('row').filter({ has: getByRole('link', { name: 'MacBook Air', exact: true }) }).getByRole('link', { name: 'MacBook Air', exact: true })

```

# Test source

```ts
  1  | import { Locator, Page } from '@playwright/test';
  2  | 
  3  | export class CartPage {
  4  |     private readonly page: Page;
  5  | 
  6  |     // Locators
  7  |     private readonly stockWarning: Locator;
  8  |     private readonly cartTotalRow: Locator;
  9  | 
  10 |     constructor(page: Page) {
  11 |         this.page = page;
  12 | 
  13 |         // Initialize locators with CSS selectors
  14 |         this.stockWarning = page.getByText(
  15 |             'Products marked with *** are not available in the desired quantity or not in stock!',
  16 |             { exact: true }
  17 |         );
  18 |         this.cartTotalRow = page.getByRole('row').filter({ hasText: /^Total:/ });
  19 |     }
  20 | 
  21 |     /**
  22 |      * Checks whether the shopping cart page is displayed.
  23 |      * @returns Whether the shopping cart heading is visible
  24 |      */
  25 |     async isShoppingCartVisible(): Promise<boolean> {
  26 |         return this.page.getByRole('heading', { name: /^Shopping Cart/ }).isVisible();
  27 |     }
  28 | 
  29 |     /**
  30 |      * Checks whether a product is present in the shopping cart.
  31 |      * @param productName - Expected product name
  32 |      * @returns Whether the product link is visible in the cart
  33 |      */
  34 |     async isProductInCart(productName: string): Promise<boolean> {
> 35 |         return this.getProductRow(productName).getByRole('link', { name: productName, exact: true }).isVisible();
     |                                                                                                      ^ Error: locator.isVisible: Error: strict mode violation: getByRole('row').filter({ has: getByRole('link', { name: 'MacBook Air', exact: true }) }).getByRole('link', { name: 'MacBook Air', exact: true }) resolved to 2 elements:
  36 |     }
  37 | 
  38 |     /**
  39 |      * Reads the selected product quantity from the cart.
  40 |      * @param productName - Product whose quantity should be read
  41 |      * @returns The displayed quantity
  42 |      */
  43 |     async getProductQuantity(productName: string): Promise<string> {
  44 |         return this.getProductRow(productName).locator('input[name="quantity"]').inputValue();
  45 |     }
  46 | 
  47 |     /**
  48 |      * Reads the selected product's unit price from the cart.
  49 |      * @param productName - Product whose price should be read
  50 |      * @returns The displayed unit price
  51 |      */
  52 |     async getProductPrice(productName: string): Promise<string> {
  53 |         return (await this.getProductRow(productName).getByRole('cell').nth(4).innerText()).trim();
  54 |     }
  55 | 
  56 |     /**
  57 |      * Reads the applicable cart total.
  58 |      * @returns The displayed cart total
  59 |      */
  60 |     async getCartTotal(): Promise<string> {
  61 |         return (await this.cartTotalRow.getByRole('cell').nth(1).innerText()).trim();
  62 |     }
  63 | 
  64 |     /**
  65 |      * Checks whether the cart displays an insufficient-stock warning.
  66 |      * @returns Whether the stock warning is visible
  67 |      */
  68 |     async isStockWarningVisible(): Promise<boolean> {
  69 |         return this.stockWarning.isVisible();
  70 |     }
  71 | 
  72 |     private getProductRow(productName: string): Locator {
  73 |         return this.page.getByRole('row').filter({
  74 |             has: this.page.getByRole('link', { name: productName, exact: true })
  75 |         });
  76 |     }
  77 | }
  78 | 
```