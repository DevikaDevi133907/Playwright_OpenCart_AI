import Ajv from 'ajv';
import { expect, test, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
const CART_PAYLOAD = {
    date: '2020-01-01T00:00:00.000Z',
    products: [{ productId: 1, quantity: 2 }]
};

async function getFirstCart(request: APIRequestContext): Promise<Record<string, any>> {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
    expect(response.status(), 'Cart lookup should return status 200').toBe(200);
    const carts = await response.json();
    expect(Array.isArray(carts), 'Cart lookup should return an array').toBe(true);
    expect(carts.length, 'At least one cart is required for this test').toBeGreaterThan(0);
    return carts[0];
}

async function getFirstUserId(request: APIRequestContext): Promise<number> {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
    expect(response.status(), 'User lookup should return status 200').toBe(200);
    const users = await response.json();
    expect(Array.isArray(users), 'User lookup should return an array').toBe(true);
    expect(users.length, 'At least one user is required for a cart').toBeGreaterThan(0);
    return users[0].id;
}

async function getFirstProductId(request: APIRequestContext): Promise<number> {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
    expect(response.status(), 'Product lookup should return status 200').toBe(200);
    const products = await response.json();
    expect(Array.isArray(products), 'Product lookup should return an array').toBe(true);
    expect(products.length, 'At least one product is required for a cart').toBeGreaterThan(0);
    return products[0].id;
}

test.describe('FakeStore Carts API Tests', () => {
    test('GET - All carts @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
        expect(response.status(), 'Get all carts should return status 200').toBe(200);

        const carts = await response.json();
        expect(Array.isArray(carts), 'Carts response should be an array').toBe(true);
        expect(carts.length, 'Carts response should not be empty').toBeGreaterThan(0);
    });

    test('GET - Cart by id @master @sanity @api', async ({ request }) => {
        const cart = await getFirstCart(request);
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(cart.id));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Get cart by id should return status 200').toBe(200);

        const responseBody = await response.json();
        expect(responseBody.id, 'Returned cart id should match the requested id').toBe(cart.id);
    });

    test('GET - Carts by date range @master @regression @api', async ({ request }) => {
        const allCartsResponse = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
        expect(allCartsResponse.status(), 'Cart date-range setup should return status 200').toBe(200);
        const allCarts = await allCartsResponse.json();
        expect(Array.isArray(allCarts), 'Cart date-range setup should return an array').toBe(true);
        expect(allCarts.length, 'Cart date-range setup requires at least one cart').toBeGreaterThan(0);

        const timestamps = allCarts.map((cart: { date: string }) => Date.parse(cart.date));
        const startDay = new Date(Math.min(...timestamps)).toISOString().slice(0, 10);
        const endDay = new Date(Math.max(...timestamps)).toISOString().slice(0, 10);
        const startDate = startDay;
        const endDate = endDay;
        const route = Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startdate}', encodeURIComponent(startDate))
            .replace('{enddate}', encodeURIComponent(endDate));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Cart date-range request should return status 200').toBe(200);

        const carts = await response.json();
        expect(Array.isArray(carts), 'Date-range carts response should be an array').toBe(true);
        for (const cart of carts) {
            const timestamp = Date.parse(cart.date);
            expect(timestamp, 'Cart date should not be earlier than the requested start').toBeGreaterThanOrEqual(Date.parse(startDate));
            expect(timestamp, 'Cart date should not be later than the requested end').toBeLessThanOrEqual(Date.parse(endDate));
        }
    });

    test('GET - Carts for a user @master @sanity @api', async ({ request }) => {
        const firstCart = await getFirstCart(request);
        const userId = firstCart.userId;
        const route = Routes.GET_USER_CART.replace('{userId}', String(userId));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Get user carts should return status 200').toBe(200);

        const userCarts = await response.json();
        expect(Array.isArray(userCarts), 'User carts response should be an array').toBe(true);
        expect(userCarts.length, 'Selected user should have cart records').toBeGreaterThan(0);
        for (const cart of userCarts) {
            expect(cart.userId, 'Every returned cart should belong to the selected user').toBe(userId);
        }
    });

    test('GET - Carts with limit @master @sanity @api', async ({ request }) => {
        const limit = 3;
        const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(limit));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited carts request should return status 200').toBe(200);

        const carts = await response.json();
        expect(Array.isArray(carts), 'Limited carts response should be an array').toBe(true);
        expect(carts.length, 'Carts response should match the requested limit').toBe(limit);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Carts sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_CARTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Sorted carts (${order}) should return status 200`).toBe(200);

            const carts = await response.json();
            expect(Array.isArray(carts), 'Sorted carts response should be an array').toBe(true);
            const ids = carts.map((cart: { id: number }) => cart.id);
            expect(ids.length, 'Sorted carts response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) => order === 'asc' ? left - right : right - left);
            expect(ids, `Cart ids should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('POST - Create cart @master @regression @api', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const productId = await getFirstProductId(request);
        const payload = { ...CART_PAYLOAD, userId, products: [{ productId, quantity: 2 }] };
        const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: payload });
        expect(response.status(), 'Create cart should return status 201').toBe(201);

        const createdCart = await response.json();
        expect(createdCart.id, 'Created cart should have a numeric id').toEqual(expect.any(Number));
        expect(createdCart.userId, 'Created cart should retain the submitted user id').toBe(userId);
        expect(createdCart.products, 'Created cart should retain the submitted products').toEqual(payload.products);
    });

    test('PUT - Update cart @master @regression @api', async ({ request }) => {
        const cart = await getFirstCart(request);
        const route = Routes.UPDATE_CART.replace('{id}', String(cart.id));
        const products = cart.products.map((product: { productId: number; quantity: number }, index: number) => ({
            ...product,
            quantity: index === 0 ? product.quantity + 1 : product.quantity
        }));
        const response = await request.put(`${BASE_URL}${route}`, {
            data: { userId: cart.userId, date: cart.date, products }
        });
        expect(response.status(), 'Update cart should return status 200').toBe(200);

        const responseBody = await response.json();
        expect(responseBody.id, 'Updated cart id should match the requested id').toBe(cart.id);
        expect(responseBody.products, 'Updated cart should reflect the changed product quantity').toEqual(products);
    });

    test('DELETE - Cart @master @regression @api', async ({ request }) => {
        const cart = await getFirstCart(request);
        const route = Routes.DELETE_CART.replace('{id}', String(cart.id));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Delete cart should return status 200').toBe(200);

        const deletedCart = await response.json();
        expect(deletedCart.id, 'Delete response should identify the requested cart').toBe(cart.id);
    });

    test('GET - Cart response schema @master @regression @api', async ({ request }) => {
        const cart = await getFirstCart(request);
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(cart.id));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Cart schema request should return status 200').toBe(200);

        const responseBody = await response.json();
        const schema = DataProvider.readJson('./api/schemas/cart_api_schema.json');
        const ajv = new Ajv();
        const validateCart = ajv.compile(schema);
        const isValid = validateCart(responseBody);
        expect(isValid, `Cart response schema validation failed: ${ajv.errorsText(validateCart.errors)}`).toBe(true);
    });

    test('WORKFLOW - Create, update, and delete cart @master @regression @api @workflow', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const productId = await getFirstProductId(request);
        const createPayload = { ...CART_PAYLOAD, userId, products: [{ productId, quantity: 2 }] };
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: createPayload });
        expect(createResponse.status(), 'Workflow cart creation should return status 201').toBe(201);
        const createdCart = await createResponse.json();
        expect(createdCart.id, 'Created workflow cart should have a numeric id').toEqual(expect.any(Number));
        expect(createdCart.userId, 'Created workflow cart should retain its user id').toBe(userId);
        expect(createdCart.products, 'Created workflow cart should retain its products').toEqual(createPayload.products);

        const updateRoute = Routes.UPDATE_CART.replace('{id}', String(createdCart.id));
        const updatedProducts = createPayload.products.map(product => ({ ...product, quantity: product.quantity + 1 }));
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
            data: { ...createPayload, products: updatedProducts }
        });
        expect(updateResponse.status(), 'Workflow cart update should return status 200').toBe(200);
        const updateBody = await updateResponse.json();
        expect(updateBody.id, 'Update should use the id returned by create').toBe(createdCart.id);
        expect(updateBody.products, 'Updated workflow cart should reflect the quantity change').toEqual(updatedProducts);

        const deleteRoute = Routes.DELETE_CART.replace('{id}', String(createdCart.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Workflow cart deletion should return status 200').toBe(200);
    });
});