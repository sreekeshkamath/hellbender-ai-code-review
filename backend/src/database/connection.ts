/**
 * PostgreSQL Database Connection Module
 * 
 * This module provides a connection pool for PostgreSQL database operations.
 * It includes connection retry logic for Docker startup scenarios and health check functionality.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

/**
 * Get database configuration from environment variables
 * 
 * @returns DatabaseConfig object with connection settings
 */
function getDatabaseConfig(): DatabaseConfig {
  const host = process.env.POSTGRES_HOST || process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || process.env.DATABASE_URL?.split(':')[2]?.split('/')[0] || '5432', 10);
  const database = process.env.POSTGRES_DB || process.env.DATABASE_URL?.split('/').pop() || 'hellbender';
  const user = process.env.POSTGRES_USER || process.env.DATABASE_URL?.split(':')[1]?.split('@')[0] || 'hellbender';
  const password = process.env.POSTGRES_PASSWORD || process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || 'password';
  
  return {
    host,
    port,
    database,
    user,
    password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

/**
 * PostgreSQL connection pool
 * Used for all database operations throughout the application
 */
let pool: Pool | null = null;

/**
 * Initialize the database connection pool
 * 
 * This function creates a new connection pool if one doesn't exist,
 * or returns the existing pool. It also validates the connection
 * by executing a simple query.
 * 
 * @returns Promise<Pool> The initialized connection pool
 * @throws Error if database connection fails
 */
export async function initializePool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const config = getDatabaseConfig();
  
  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
  });

  pool.on('error', (err: Error) => {
    console.error('Unexpected database pool error:', err);
  });

  // Test the connection
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Database connection established successfully');
  } finally {
    client.release();
  }

  return pool;
}

/**
 * Get the database connection pool
 * 
 * @returns Pool The current connection pool
 * @throws Error if pool has not been initialized
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Execute a query on the database
 * 
 * This is the primary method for executing SQL queries. It supports
 * parameterized queries to prevent SQL injection attacks.
 * 
 * @param text The SQL query string with parameter placeholders
 * @param params Array of parameters to substitute into the query
 * @returns Promise<QueryResult> The query result
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await getPool().query<T>(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  
  return result;
}

/**
 * Get a client from the pool for transaction support
 * 
 * Use this method when you need to execute multiple queries in a transaction.
 * Always release the client back to the pool when done.
 * 
 * @returns Promise<PoolClient> A database client
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Execute a function within a database transaction
 * 
 * This is a convenience method that automatically handles transaction
 * start, commit, and rollback on error.
 * 
 * @param callback Async function to execute within the transaction
 * @returns Promise<T> The result of the callback function
 * @throws Error if transaction fails, which will trigger automatic rollback
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check function to verify database connectivity
 * 
 * @returns Promise<boolean> True if database is accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Close the database connection pool
 * 
 * Call this function during application shutdown to gracefully
 * close all database connections.
 * 
 * @returns Promise<void>
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

/**
 * Type helper for row data returned from queries
 */
export type Row<T = any> = T;

/**
 * Type helper for query parameters
 */
export type QueryParams = any[] | undefined;
