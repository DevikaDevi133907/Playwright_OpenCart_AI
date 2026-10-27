import mysql from 'mysql2/promise';
import type { ExecuteValues, QueryResult } from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

export async function executeQuery<T extends QueryResult = QueryResult>(sql: string, params?: ExecuteValues[]) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [result] = await connection.execute(sql, params);
        return result as T;
    } finally {
        await connection.end();
    }
}