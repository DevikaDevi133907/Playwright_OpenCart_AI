import { test, expect } from '@playwright/test';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv';
import { HomePage } from '../../pages/HomePage';
import { RegisterPage } from '../../pages/RegisterPage';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { executeQuery } from '../../utils/dbClient';

dotenv.config();

const storefrontUrl = process.env.OPENCART_URL;
const adminUrl = process.env.OPENCART_ADMIN_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const databaseName = process.env.DB_NAME;

type DateAddedColumn = RowDataPacket & { column_count: number | string };
type CustomerRecord = RowDataPacket & {
    firstname: string;
    lastname: string;
    email: string;
    status: number | string;
    date_added?: Date | string | null;
};

if (!storefrontUrl || !adminUrl || !adminUsername || !adminPassword || !databaseName) {
    throw new Error('OPENCART_URL, OPENCART_ADMIN_URL, ADMIN_USERNAME, ADMIN_PASSWORD, and DB_NAME must be configured to run the customer registration DB test.');
}

test('Register customer and verify Admin and MySQL records @master @sanity @regression @db @end-to-end', async ({ page }) => {
    const customer = RandomDataUtil.generateCustomerRegistrationPayload();
    customer.email = customer.email.replace('@', `+${Date.now()}@`);
    const homePage = new HomePage(page);
    const registerPage = new RegisterPage(page);
    let adminStatus = '';
    let registrationAttempted = false;

    try {
        await test.step('1) Register a customer through the storefront', async () => {
            const storefrontResponse = await page.goto(storefrontUrl);
            expect(
                storefrontResponse?.ok(),
                `The OpenCart storefront at ${storefrontUrl} must return a successful response; received HTTP ${storefrontResponse?.status() ?? 'no response'}.`
            ).toBe(true);
            await homePage.openRegistration();
            await expect(page.getByRole('heading', { name: 'Register Account', exact: true })).toBeVisible();

            registrationAttempted = true;
            await registerPage.register(customer);
            await expect(
                page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true }),
                'The storefront should confirm that the customer account was created.'
            ).toBeVisible();
        });

        await test.step('2) Find and validate the customer in the Admin Portal', async () => {
            const adminResponse = await page.goto(adminUrl);
            expect(
                adminResponse?.ok(),
                `The OpenCart Admin Portal at ${adminUrl} must return a successful response; received HTTP ${adminResponse?.status() ?? 'no response'}.`
            ).toBe(true);
            await page.getByLabel('Username').fill(adminUsername);
            await page.getByLabel('Password').fill(adminPassword);
            await page.getByRole('button', { name: 'Login', exact: true }).click();

            const customersMenu = page.locator('#menu-customer');
            await expect(customersMenu, 'The Admin Portal should be logged in and show its customer menu.').toBeVisible();
            await customersMenu.click();

            const customersLink = page.getByRole('link', { name: 'Customers', exact: true });
            await expect(customersLink).toBeVisible();
            await customersLink.click();
            await expect(page).toHaveURL(/route=customer\/customer/);

            await page.locator('#input-email').fill(customer.email);
            await page.locator('#button-filter').click();

            const customerRow = page.getByRole('row').filter({ hasText: customer.email });
            await expect(customerRow, 'The Admin customer list should contain exactly one matching email.').toHaveCount(1);
            await customerRow.getByRole('link', { name: 'Edit' }).click();

            await expect(page.locator('#input-firstname')).toHaveValue(customer.firstName);
            await expect(page.locator('#input-lastname')).toHaveValue(customer.lastName);
            await expect(page.locator('#input-email')).toHaveValue(customer.email);

            const statusField = page.locator('#input-status');
            await expect(statusField, 'The customer status should be displayed in the Admin Portal.').toBeVisible();
            adminStatus = await statusField.inputValue();
            expect(['0', '1'], 'The Admin Portal should display a valid customer status.').toContain(adminStatus);
        });

        await test.step('3) Validate the customer record in MySQL', async () => {
            const dateAddedColumn = await executeQuery<DateAddedColumn[]>(
                'SELECT COUNT(*) AS column_count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [databaseName, 'oc_customer', 'date_added']
            );
            const hasDateAdded = Number(dateAddedColumn[0]?.column_count) > 0;
            const columns = ['firstname', 'lastname', 'email', 'status'];
            if (hasDateAdded) {
                columns.push('date_added');
            }

            const rows = await executeQuery<CustomerRecord[]>(
                `SELECT ${columns.join(', ')} FROM oc_customer WHERE email = ?`,
                [customer.email]
            );
            expect(rows, 'MySQL should contain exactly one customer with the generated email.').toHaveLength(1);

            const record = rows[0];
            expect(record.firstname, 'The database first name should match the registered customer.').toBe(customer.firstName);
            expect(record.lastname, 'The database last name should match the registered customer.').toBe(customer.lastName);
            expect(record.email, 'The database email should match the registered customer.').toBe(customer.email);
            expect(Number(record.status), 'The database customer status should match the Admin Portal.').toBe(Number(adminStatus));
            if (hasDateAdded) {
                expect(record.date_added, 'The date_added value should be present when the column is available.').toBeTruthy();
            }
        });
    } finally {
        if (registrationAttempted) {
            await executeQuery<ResultSetHeader>('DELETE FROM oc_customer WHERE email = ?', [customer.email]);
        }
    }
});
