# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: web\end-to-end-shopping-flow.spec.ts >> Complete customer shopping journey @master @sanity @regression @web @end-to-end
- Location: tests\web\end-to-end-shopping-flow.spec.ts:17:5

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1  | /**
  2  |  * Test Case: Complete OpenCart customer shopping journey
  3  |  *
  4  |  * Tags: @master @sanity @regression @web @end-to-end
  5  |  *
  6  |  * Steps:
  7  |  * 1) Register a new customer with unique data.
  8  |  * 2) Verify registration, log out, and sign back in.
  9  |  * 3) Search for an in-stock product and add it to the cart.
  10 |  * 4) Verify the product, quantity, price, and cart total.
  11 |  */
  12 | 
  13 | import { test, expect } from '../../fixtures/pageFixtures';
  14 | import { Helper } from '../../utils/helper';
  15 | import { RandomDataUtil } from '../../utils/dataGenerator';
  16 | 
  17 | test('Complete customer shopping journey @master @sanity @regression @web @end-to-end', async ({
  18 |     homePage,
  19 |     registerPage,
  20 |     loginPage,
  21 |     accountPage,
  22 |     productPage,
  23 |     cartPage
  24 | }) => {
  25 |     const customer = RandomDataUtil.generateCustomerRegistrationPayload();
  26 |     customer.email = customer.email.replace('@', `+${Date.now()}@`);
  27 |     const product = Helper.getProductDetails();
  28 | 
  29 |     await test.step('1) Open the storefront and register a new customer', async () => {
  30 |         await homePage.openRegistration();
> 31 |         expect(await registerPage.isRegistrationPageVisible()).toBeTruthy();
     |                                                                ^ Error: expect(received).toBeTruthy()
  32 | 
  33 |         await registerPage.register(customer);
  34 |         expect(await registerPage.isAccountCreatedVisible()).toBeTruthy();
  35 |         await registerPage.continueToAccount();
  36 |         expect(await accountPage.isDashboardVisible()).toBeTruthy();
  37 |     });
  38 | 
  39 |     await test.step('2) Log out and sign in with the new customer credentials', async () => {
  40 |         await homePage.logout();
  41 |         expect(await accountPage.isLogoutConfirmationVisible()).toBeTruthy();
  42 |         await accountPage.continueAfterLogout();
  43 | 
  44 |         await homePage.openLogin();
  45 |         expect(await loginPage.isLoginPageVisible()).toBeTruthy();
  46 |         await loginPage.login(customer.email, customer.password);
  47 |         expect(await accountPage.isDashboardVisible()).toBeTruthy();
  48 |     });
  49 | 
  50 |     await test.step('3) Search for the product and add it to the cart', async () => {
  51 |         await homePage.searchProduct(product.productName);
  52 |         expect(await productPage.isProductDetailsVisible(product.productName)).toBeTruthy();
  53 |         expect(await productPage.getProductPrice()).toBe(product.totalPrice);
  54 | 
  55 |         await productPage.setQuantity(product.productQuantity);
  56 |         await productPage.addToCart();
  57 |         expect(await productPage.isProductAddedVisible()).toBeTruthy();
  58 |         await homePage.openShoppingCart();
  59 |     });
  60 | 
  61 |     await test.step('4) Verify the cart contents and finish without errors', async () => {
  62 |         expect(await cartPage.isShoppingCartVisible()).toBeTruthy();
  63 |         expect(await cartPage.isProductInCart(product.productName)).toBeTruthy();
  64 |         expect(await cartPage.getProductQuantity(product.productName)).toBe(product.productQuantity);
  65 |         expect(await cartPage.getProductPrice(product.productName)).toBe(product.totalPrice);
  66 |         expect(await cartPage.getCartTotal()).toBe(product.totalPrice);
  67 |         expect(await cartPage.isStockWarningVisible()).toBeFalsy();
  68 |     });
  69 | 
  70 |     console.log('✅ Completed the OpenCart customer shopping journey successfully!');
  71 | });
  72 | 
```