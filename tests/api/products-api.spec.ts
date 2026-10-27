import Ajv from 'ajv';
import { expect, test, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
const PRODUCT_PAYLOAD = {
    title: 'Playwright deterministic product',
    price: 19.99,
    description: 'Product payload for FakeStore API tests',
    image: 'https://example.com/playwright-product.png',
    category: 'electronics'
};

async function getFirstProductId(request: APIRequestContext): Promise<number> {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
    expect(response.status(), 'Product lookup should return status 200').toBe(200);
    const products = await response.json();
    expect(Array.isArray(products), 'Product lookup should return an array').toBe(true);
    expect(products.length, 'At least one product is required for this test').toBeGreaterThan(0);
    return products[0].id;
}

function expectProductFields(product: Record<string, unknown>): void {
    expect(product.id, 'Product id should be numeric').toEqual(expect.any(Number));
    expect(product.title, 'Product title should be a non-empty string').toEqual(expect.any(String));
    expect(product.price, 'Product price should be numeric').toEqual(expect.any(Number));
    expect(product.category, 'Product category should be a non-empty string').toEqual(expect.any(String));
    expect(product.image, 'Product image should be a non-empty string').toEqual(expect.any(String));
}

test.describe('FakeStore Products API Tests', () => {
    test('GET - All products @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
        expect(response.status(), 'Get all products should return status 200').toBe(200);

        const products = await response.json();
        expect(Array.isArray(products), 'Products response should be an array').toBe(true);
        expect(products.length, 'Products response should not be empty').toBeGreaterThan(0);
        for (const product of products) {
            expectProductFields(product);
        }
    });

    test('GET - Product by id @master @sanity @api', async ({ request }) => {
        const productId = await getFirstProductId(request);
        const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(productId));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Get product by id should return status 200').toBe(200);

        const product = await response.json();
        expect(product.id, 'Returned product id should match the requested id').toBe(productId);
        expectProductFields(product);
    });

    test('GET - Products with limit @master @sanity @api', async ({ request }) => {
        const limit = 3;
        const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(limit));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited products request should return status 200').toBe(200);

        const products = await response.json();
        expect(Array.isArray(products), 'Limited products response should be an array').toBe(true);
        expect(products.length, 'Products response should match the requested limit').toBe(limit);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Products sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Sorted products (${order}) should return status 200`).toBe(200);

            const products = await response.json();
            expect(Array.isArray(products), 'Sorted products response should be an array').toBe(true);
            const ids = products.map((product: { id: number }) => product.id);
            expect(ids.length, 'Sorted products response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) => order === 'asc' ? left - right : right - left);
            expect(ids, `Product ids should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('GET - All product categories @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);
        expect(response.status(), 'Get product categories should return status 200').toBe(200);

        const categories = await response.json();
        expect(Array.isArray(categories), 'Categories response should be an array').toBe(true);
        expect(categories.length, 'Categories response should not be empty').toBeGreaterThan(0);
    });

    test('GET - Products by category @master @sanity @api', async ({ request }) => {
        const category = 'electronics';
        const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', encodeURIComponent(category));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Get products by category should return status 200').toBe(200);

        const products = await response.json();
        expect(Array.isArray(products), 'Category products response should be an array').toBe(true);
        expect(products.length, 'Selected category should contain products').toBeGreaterThan(0);
        for (const product of products) {
            expect(product.category, 'Every returned product should match the selected category').toBe(category);
        }
    });

    test('POST - Create product @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: PRODUCT_PAYLOAD });
        expect(response.status(), 'Create product should return status 201').toBe(201);

        const createdProduct = await response.json();
        expect(createdProduct.id, 'Created product should have a numeric id').toEqual(expect.any(Number));
        for (const [field, value] of Object.entries(PRODUCT_PAYLOAD)) {
            expect(createdProduct[field], `Created product should retain ${field}`).toBe(value);
        }
    });

    test('PUT - Update product @master @regression @api', async ({ request }) => {
        const productId = await getFirstProductId(request);
        const route = Routes.UPDATE_PRODUCT.replace('{id}', String(productId));
        const updatedProduct = { ...PRODUCT_PAYLOAD, title: 'Playwright updated product' };
        const response = await request.put(`${BASE_URL}${route}`, { data: updatedProduct });
        expect(response.status(), 'Update product should return status 200').toBe(200);

        const responseBody = await response.json();
        expect(responseBody.id, 'Updated product id should match the requested id').toBe(productId);
        for (const [field, value] of Object.entries(updatedProduct)) {
            expect(responseBody[field], `Updated product should contain ${field}`).toBe(value);
        }
    });

    test('DELETE - Product @master @regression @api', async ({ request }) => {
        const productId = await getFirstProductId(request);
        const route = Routes.DELETE_PRODUCT.replace('{id}', String(productId));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Delete product should return status 200').toBe(200);

        const deletedProduct = await response.json();
        expect(deletedProduct.id, 'Delete response should identify the requested product').toBe(productId);
    });

    test('GET - Product response schema @master @regression @api', async ({ request }) => {
        const productId = await getFirstProductId(request);
        const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(productId));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Product schema request should return status 200').toBe(200);

        const product = await response.json();
        const schema = DataProvider.readJson('./api/schemas/product_api_schema.json');
        const ajv = new Ajv();
        const validateProduct = ajv.compile(schema);
        const isValid = validateProduct(product);
        expect(isValid, `Product response schema validation failed: ${ajv.errorsText(validateProduct.errors)}`).toBe(true);
    });

    test('WORKFLOW - Create, update, and delete product @master @regression @api @workflow', async ({ request }) => {
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: PRODUCT_PAYLOAD });
        expect(createResponse.status(), 'Workflow product creation should return status 201').toBe(201);
        const createdProduct = await createResponse.json();
        expect(createdProduct.id, 'Created workflow product should have a numeric id').toEqual(expect.any(Number));

        const updateRoute = Routes.UPDATE_PRODUCT.replace('{id}', String(createdProduct.id));
        const updatedProduct = { ...PRODUCT_PAYLOAD, title: 'Playwright workflow updated product' };
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatedProduct });
        expect(updateResponse.status(), 'Workflow product update should return status 200').toBe(200);
        const updateBody = await updateResponse.json();
        expect(updateBody.id, 'Update should use the id returned by create').toBe(createdProduct.id);
        expect(updateBody.title, 'Updated workflow product should contain its new title').toBe(updatedProduct.title);

        const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(createdProduct.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Workflow product deletion should return status 200').toBe(200);
    });
});