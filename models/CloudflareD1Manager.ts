/**
 * CloudflareD1Manager - Manages operations with Cloudflare D1 database
 *
 * This class provides methods to interact with Cloudflare D1 SQL database,
 * including executing queries, prepared statements, and batch operations.
 * It uses a Cloudflare Worker as a proxy to communicate with the D1 database.
 */
export class CloudflareD1Manager {
    private static instance: CloudflareD1Manager;
    private apiKey: string;
    private workerUrl: string;

    /**
     * Private constructor to enforce singleton pattern
     * @param workerUrl URL of the Cloudflare Worker that provides the D1 API
     * @param apiKey API key for authenticating with the Worker
     */
    private constructor(workerUrl: string, apiKey: string) {
        this.workerUrl = workerUrl;
        this.apiKey = apiKey;
    }

    /**
     * Get the singleton instance of CloudflareD1Manager
     * @param workerUrl URL of the Cloudflare Worker that provides the D1 API
     * @param apiKey API key for authenticating with the Worker
     * @returns CloudflareD1Manager instance
     */
    public static getInstance(
        workerUrl?: string,
        apiKey?: string
    ): CloudflareD1Manager {
        if (!CloudflareD1Manager.instance) {
            if (!workerUrl || !apiKey) {
                throw new Error("Worker URL and API key are required for initialization");
            }
            CloudflareD1Manager.instance = new CloudflareD1Manager(
                workerUrl,
                apiKey
            );
        }
        return CloudflareD1Manager.instance;
    }

    /**
     * Execute a SQL query with optional parameters
     * @param query SQL query to execute
     * @param params Optional parameters for the query
     * @returns Query result
     */
    public async executeQuery<T = any>(query: string, params: any[] = []): Promise<D1Result<T>> {
        try {
            const response = await fetch(`${this.workerUrl}/api/d1/query`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sql: query,
                    params: params,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`D1 API error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return this.formatD1Result<T>(data.result);
        } catch (error) {
            console.error("Error executing D1 query:", error);
            throw error;
        }
    }

    /**
     * Execute a batch of SQL queries
     * @param statements Array of SQL statements with their parameters
     * @returns Array of query results
     */
    public async executeBatch<T = any>(
        statements: { sql: string; params?: any[] }[]
    ): Promise<D1Result<T>[]> {
        try {
            const response = await fetch(`${this.workerUrl}/api/d1/query/batch`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batch: statements.map(stmt => ({
                        sql: stmt.sql,
                        params: stmt.params || [],
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`D1 API error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return data.result.map((result: any) => this.formatD1Result<T>(result));
        } catch (error) {
            console.error("Error executing D1 batch:", error);
            throw error;
        }
    }

    /**
     * Execute a raw SQL query without parameter binding
     * @param sql Raw SQL query to execute
     * @returns Query result
     */
    public async executeRawQuery<T = any>(sql: string): Promise<D1ExecResult> {
        try {
            const response = await fetch(`${this.workerUrl}/api/d1/query/raw`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sql: sql,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`D1 API error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return {
                count: data.result.count || 0,
                duration: data.result.duration || 0,
            };
        } catch (error) {
            console.error("Error executing D1 raw query:", error);
            throw error;
        }
    }

    /**
     * Get a single row from a query result
     * @param query SQL query to execute
     * @param params Optional parameters for the query
     * @returns First row of the query result or null if no rows
     */
    public async getFirst<T = any>(query: string, params: any[] = []): Promise<T | null> {
        const result = await this.executeQuery<T>(query, params);
        return result.results.length > 0 ? result.results[0] : null;
    }

    /**
     * Get all rows from a query result
     * @param query SQL query to execute
     * @param params Optional parameters for the query
     * @returns Array of rows from the query result
     */
    public async getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
        const result = await this.executeQuery<T>(query, params);
        return result.results;
    }

    /**
     * Create a table in the D1 database
     * @param tableName Name of the table to create
     * @param columns Column definitions
     * @returns Result of the operation
     */
    public async createTable(tableName: string, columns: string): Promise<D1ExecResult> {
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
        return await this.executeRawQuery(sql);
    }

    /**
     * Drop a table from the D1 database
     * @param tableName Name of the table to drop
     * @returns Result of the operation
     */
    public async dropTable(tableName: string): Promise<D1ExecResult> {
        const sql = `DROP TABLE IF EXISTS ${tableName}`;
        return await this.executeRawQuery(sql);
    }

    /**
     * Insert a row into a table
     * @param tableName Name of the table
     * @param data Object containing column-value pairs
     * @returns Result of the operation
     */
    public async insert<T = any>(tableName: string, data: Record<string, any>): Promise<D1Result<T>> {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);

        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        return await this.executeQuery<T>(sql, values);
    }

    /**
     * Update rows in a table
     * @param tableName Name of the table
     * @param data Object containing column-value pairs to update
     * @param whereClause WHERE clause for the update
     * @param whereParams Parameters for the WHERE clause
     * @returns Result of the operation
     */
    public async update<T = any>(
        tableName: string,
        data: Record<string, any>,
        whereClause: string,
        whereParams: any[] = []
    ): Promise<D1Result<T>> {
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(data), ...whereParams];

        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        return await this.executeQuery<T>(sql, values);
    }

    /**
     * Delete rows from a table
     * @param tableName Name of the table
     * @param whereClause WHERE clause for the delete
     * @param whereParams Parameters for the WHERE clause
     * @returns Result of the operation
     */
    public async delete<T = any>(
        tableName: string,
        whereClause: string,
        whereParams: any[] = []
    ): Promise<D1Result<T>> {
        const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        return await this.executeQuery<T>(sql, whereParams);
    }

    /**
     * Format the D1 API response into a consistent D1Result object
     * @param apiResult Raw API result
     * @returns Formatted D1Result object
     */
    private formatD1Result<T>(apiResult: any): D1Result<T> {
        return {
            success: apiResult.success || true,
            results: apiResult.results || [],
            meta: {
                duration: apiResult.meta?.duration || 0,
                changes: apiResult.meta?.changes || 0,
                last_row_id: apiResult.meta?.last_row_id || 0,
                served_by: apiResult.meta?.served_by || '',
                changed_db: apiResult.meta?.changed_db || false,
                size_after: apiResult.meta?.size_after || 0,
                rows_read: apiResult.meta?.rows_read || 0,
                rows_written: apiResult.meta?.rows_written || 0,
            }
        };
    }
}

/**
 * Interface for D1 query result
 */
export interface D1Result<T = any> {
    success: boolean;
    results: T[];
    meta: {
        duration: number;
        changes: number;
        last_row_id: number;
        served_by: string;
        changed_db: boolean;
        size_after: number;
        rows_read: number;
        rows_written: number;
    };
}

/**
 * Interface for D1 exec result
 */
export interface D1ExecResult {
    count: number;
    duration: number;
}
