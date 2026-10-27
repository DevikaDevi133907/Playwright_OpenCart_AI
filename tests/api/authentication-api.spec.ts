import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import { Routes } from '../../api/endpoints/routes';

const DOTENV_VALUES = dotenv.config().parsed;

const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;

test.describe('FakeStore Authentication API Tests', () => {
    test('POST - Login with valid credentials @master @sanity @api', async ({ request }) => {
        const username = DOTENV_VALUES?.USERNAME || process.env.USERNAME;
        const password = DOTENV_VALUES?.PASSWORD || process.env.PASSWORD;
        expect(username, 'USERNAME must be configured in .env').toBeTruthy();
        expect(password, 'PASSWORD must be configured in .env').toBeTruthy();

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: { username, password }
        });

        expect(response.status(), 'Valid credentials should return status 201').toBe(201);
        const responseBody = await response.json();
        expect(responseBody, 'Login response should contain a token').toHaveProperty('token');
        expect(typeof responseBody.token, 'Authentication token should be a string').toBe('string');
        expect(responseBody.token.length, 'Authentication token should not be empty').toBeGreaterThan(0);
    });

    test('POST - Reject invalid credentials @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: {
                username: 'invalid-playwright-api-user',
                password: 'invalid-playwright-api-password'
            }
        });

        expect(response.status(), 'Invalid credentials should return status 401').toBe(401);
        const responseBody = await response.text();
        expect(responseBody, 'API should return its documented login error').toBe(
            'username or password is incorrect'
        );
    });
});