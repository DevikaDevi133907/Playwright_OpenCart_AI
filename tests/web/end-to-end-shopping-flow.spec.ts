/**
 * Test Case: Complete OpenCart customer shopping journey
 *
 * Tags: @master @sanity @regression @web @end-to-end
 *
 * Steps:
 * 1) Register a new customer with unique data.
 * 2) Verify registration, log out, and sign back in.
 * 3) Search for an in-stock product and add it to the cart.
 * 4) Verify the product, quantity, price, and cart total.
 */

import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';
import { RandomDataUtil } from '../../utils/dataGenerator';

test('Complete customer shopping journey @master @sanity @regression @web @end-to-end', async ({
    homePage,
    registerPage,
    loginPage,
    accountPage,
    productPage,
    searchResultsPage,
    cartPage
}) => {
    const customer = RandomDataUtil.generateCustomerRegistrationPayload();
    customer.email = customer.email.replace('@', `+${Date.now()}@`);
    const product = Helper.getProductDetails();

    await test.step('1) Open the storefront and register a new customer', async () => {
        await homePage.openRegistration();
        expect(await registerPage.isRegistrationPageVisible()).toBeTruthy();

        await registerPage.register(customer);
        expect(await registerPage.isAccountCreatedVisible()).toBeTruthy();
        await registerPage.continueToAccount();
        expect(await accountPage.isDashboardVisible()).toBeTruthy();
    });

    await test.step('2) Log out and sign in with the new customer credentials', async () => {
        await homePage.logout();
        expect(await accountPage.isLogoutConfirmationVisible()).toBeTruthy();
        await accountPage.continueAfterLogout();

        await homePage.openLogin();
        expect(await loginPage.isLoginPageVisible()).toBeTruthy();
        await loginPage.login(customer.email, customer.password);
        expect(await accountPage.isDashboardVisible()).toBeTruthy();
    });

    await test.step('3) Search for the product and add it to the cart', async () => {
        await homePage.searchProduct(product.productName);
        expect(await searchResultsPage.isSearchResultsVisible()).toBeTruthy();
        expect(await searchResultsPage.isProductDisplayed(product.productName)).toBeTruthy();
        await searchResultsPage.openProduct(product.productName);
        expect(await productPage.isProductDetailsVisible(product.productName)).toBeTruthy();
        expect(await productPage.getProductPrice()).toBe(product.totalPrice);

        await productPage.setQuantity(product.productQuantity);
        await productPage.addToCart();
        expect(await productPage.isProductAddedVisible()).toBeTruthy();
        await homePage.openShoppingCart();
    });

    await test.step('4) Verify the cart contents and finish without errors', async () => {
        expect(await cartPage.isShoppingCartVisible()).toBeTruthy();
        expect(await cartPage.isProductInCart(product.productName)).toBeTruthy();
        expect(await cartPage.getProductQuantity(product.productName)).toBe(product.productQuantity);
        expect(await cartPage.getProductPrice(product.productName)).toBe(product.totalPrice);
        expect(await cartPage.getCartTotal()).toBe(product.totalPrice);
        expect(await cartPage.isStockWarningVisible()).toBeFalsy();
    });

    console.log('✅ Completed the OpenCart customer shopping journey successfully!');
});
