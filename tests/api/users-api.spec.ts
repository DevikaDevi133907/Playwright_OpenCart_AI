import Ajv from 'ajv';
import { expect, test, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
const USER_PAYLOAD = {
    email: 'playwright.api.user@example.com',
    username: 'playwright_api_user',
    password: 'deterministic-test-password',
    name: { firstname: 'Playwright', lastname: 'ApiUser' },
    address: {
        city: 'Test City',
        street: 'Test Street',
        number: 10,
        zipcode: '12345',
        geolocation: { lat: '0', long: '0' }
    },
    phone: '555-0100'
};

async function getFirstUserId(request: APIRequestContext): Promise<number> {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
    expect(response.status(), 'User lookup should return status 200').toBe(200);
    const users = await response.json();
    expect(Array.isArray(users), 'User lookup should return an array').toBe(true);
    expect(users.length, 'At least one user is required for this test').toBeGreaterThan(0);
    return users[0].id;
}

test.describe('FakeStore Users API Tests', () => {
    test('GET - All users @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
        expect(response.status(), 'Get all users should return status 200').toBe(200);

        const users = await response.json();
        expect(Array.isArray(users), 'Users response should be an array').toBe(true);
        expect(users.length, 'Users response should not be empty').toBeGreaterThan(0);
        for (const user of users) {
            expect(user.id, 'User id should be numeric').toEqual(expect.any(Number));
            expect(user.username, 'User username should be a string').toEqual(expect.any(String));
            expect(user.email, 'User email should be a string').toEqual(expect.any(String));
        }
    });

    test('GET - User by id @master @sanity @api', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(userId));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Get user by id should return status 200').toBe(200);

        const user = await response.json();
        expect(user.id, 'Returned user id should match the requested id').toBe(userId);
    });

    test('GET - Users with limit @master @sanity @api', async ({ request }) => {
        const limit = 3;
        const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(limit));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited users request should return status 200').toBe(200);

        const users = await response.json();
        expect(Array.isArray(users), 'Limited users response should be an array').toBe(true);
        expect(users.length, 'Users response should match the requested limit').toBe(limit);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Users sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_USERS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Sorted users (${order}) should return status 200`).toBe(200);

            const users = await response.json();
            expect(Array.isArray(users), 'Sorted users response should be an array').toBe(true);
            const ids = users.map((user: { id: number }) => user.id);
            expect(ids.length, 'Sorted users response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) => order === 'asc' ? left - right : right - left);
            expect(ids, `User ids should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('POST - Create user @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: USER_PAYLOAD });
        expect(response.status(), 'Create user should return status 201').toBe(201);

        const createdUser = await response.json();
        expect(createdUser.id, 'Created user should have a numeric id').toEqual(expect.any(Number));
    });

    test('PUT - Update user @master @regression @api', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const route = Routes.UPDATE_USER.replace('{id}', String(userId));
        const updatedUser = { ...USER_PAYLOAD, username: 'playwright_updated_user' };
        const response = await request.put(`${BASE_URL}${route}`, { data: updatedUser });
        expect(response.status(), 'Update user should return status 200').toBe(200);

        const responseBody = await response.json();
        expect(responseBody.username, 'Updated user should contain the requested username').toBe(updatedUser.username);
        expect(responseBody.email, 'Updated user should contain the requested email').toBe(updatedUser.email);
    });

    test('DELETE - User @master @regression @api', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const route = Routes.DELETE_USER.replace('{id}', String(userId));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Delete user should return status 200').toBe(200);

        const deletedUser = await response.json();
        expect(deletedUser.id, 'Delete response should identify the requested user').toBe(userId);
    });

    test('GET - User response schema @master @regression @api', async ({ request }) => {
        const userId = await getFirstUserId(request);
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(userId));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'User schema request should return status 200').toBe(200);

        const user = await response.json();
        const schema = DataProvider.readJson('./api/schemas/user_api_schema.json');
        const ajv = new Ajv();
        const validateUser = ajv.compile(schema);
        const isValid = validateUser(user);
        expect(isValid, `User response schema validation failed: ${ajv.errorsText(validateUser.errors)}`).toBe(true);
    });

    test('WORKFLOW - Create, update, and delete user @master @regression @api @workflow', async ({ request }) => {
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: USER_PAYLOAD });
        expect(createResponse.status(), 'Workflow user creation should return status 201').toBe(201);
        const createdUser = await createResponse.json();
        expect(createdUser.id, 'Created workflow user should have a numeric id').toEqual(expect.any(Number));

        const updateRoute = Routes.UPDATE_USER.replace('{id}', String(createdUser.id));
        const updatedUser = { ...USER_PAYLOAD, username: 'playwright_workflow_updated_user' };
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatedUser });
        expect(updateResponse.status(), 'Workflow user update should return status 200').toBe(200);
        const updateBody = await updateResponse.json();
        expect(updateBody.username, 'Updated workflow user should contain the requested username').toBe(updatedUser.username);
        expect(updateBody.email, 'Updated workflow user should contain the requested email').toBe(updatedUser.email);

        const deleteRoute = Routes.DELETE_USER.replace('{id}', String(createdUser.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Workflow user deletion should return status 200').toBe(200);
    });
});