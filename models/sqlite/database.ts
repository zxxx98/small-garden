import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export let database: SQLite.SQLiteDatabase;

export const DatabaseInstance = {
    getInstance: () => database,
    init: async () =>
    {
        console.log("Initializing SQLite database...");
        try {
            database = await SQLite.openDatabaseAsync('small_garden.db');

            // Set up database with WAL mode for better performance
            await database.execAsync('PRAGMA journal_mode = WAL;');

            // Create tables if they don't exist
            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS plants (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    scientific_name TEXT,
                    remark TEXT,
                    img TEXT,
                    is_dead INTEGER NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS actions (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    plant_id TEXT NOT NULL,
                    time INTEGER NOT NULL,
                    remark TEXT,
                    imgs TEXT,
                    done INTEGER NOT NULL,
                    is_recurring INTEGER,
                    recurring_interval INTEGER,
                    parent_recurring_id TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_actions_plant_id ON actions (plant_id);
                CREATE INDEX IF NOT EXISTS idx_actions_parent_recurring_id ON actions (parent_recurring_id);
            `);

            // Check if migration is needed for existing databases
            try {
                // Drop and recreate the actions table if columns don't exist (only for tables without data)
                const countResult = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM actions');
                if (countResult && countResult.count === 0) {
                    // If no data, we can safely recreate the table with the correct schema
                    await database.execAsync('DROP TABLE IF EXISTS actions');
                    await database.execAsync(`
                        CREATE TABLE actions (
                            id TEXT PRIMARY KEY NOT NULL,
                            name TEXT NOT NULL,
                            plant_id TEXT NOT NULL,
                            time INTEGER NOT NULL,
                            remark TEXT,
                            imgs TEXT,
                            done INTEGER NOT NULL,
                            is_recurring INTEGER,
                            recurring_interval INTEGER,
                            parent_recurring_id TEXT
                        );
                    `);
                    await database.execAsync(`
                        CREATE INDEX idx_actions_plant_id ON actions (plant_id);
                        CREATE INDEX idx_actions_parent_recurring_id ON actions (parent_recurring_id);
                    `);
                } else {
                    // If data exists, check if columns exist before adding them
                    const tableInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(actions)");
                    const columnNames = tableInfo.map(col => col.name);
                    
                    if (!columnNames.includes('is_recurring')) {
                        await database.execAsync('ALTER TABLE actions ADD COLUMN is_recurring INTEGER');
                    }
                    
                    if (!columnNames.includes('recurring_interval')) {
                        await database.execAsync('ALTER TABLE actions ADD COLUMN recurring_interval INTEGER');
                    }
                    
                    if (!columnNames.includes('parent_recurring_id')) {
                        await database.execAsync('ALTER TABLE actions ADD COLUMN parent_recurring_id TEXT');
                    }
                }
            } catch (error) {
                console.log("Migration attempt failed:", error);
                // Continue regardless of error since the main table structure already exists
            }

            console.log("SQLite database initialized successfully");
            return Promise.resolve();
        } catch (error) {
            console.error("Database initialization failed:", error);
            return Promise.reject(error);
        }
    },
    close: async () =>
    {
        if (database) {
            await database.closeAsync();
        }
        return Promise.resolve();
    },

    // Utility function to reset the database schema
    resetSchema: async () =>
    {
        if (!database) {
            console.error("Database not initialized");
            return Promise.reject("Database not initialized");
        }

        try {
            // First, get all the plant data
            const plants = await database.getAllAsync('SELECT * FROM plants');

            // Drop existing tables
            await database.execAsync(`
                DROP TABLE IF EXISTS actions;
            `);

            // Recreate actions table with correct schema
            await database.execAsync(`
                CREATE TABLE actions (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    plant_id TEXT NOT NULL,
                    time INTEGER NOT NULL,
                    remark TEXT,
                    imgs TEXT,
                    done INTEGER NOT NULL,
                    is_recurring INTEGER,
                    recurring_interval INTEGER,
                    parent_recurring_id TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_actions_plant_id ON actions (plant_id);
                CREATE INDEX IF NOT EXISTS idx_actions_parent_recurring_id ON actions (parent_recurring_id);
            `);

            console.log("Database schema reset successfully");
            return Promise.resolve();
        } catch (error) {
            console.error("Failed to reset database schema:", error);
            return Promise.reject(error);
        }
    }
};

// Helper functions for converting between JS types and SQLite types
export const sqliteHelpers = {
    // Convert boolean to SQLite INTEGER (0 or 1)
    boolToInt: (value: boolean): number => value ? 1 : 0,

    // Convert SQLite INTEGER to boolean
    intToBool: (value: number): boolean => value === 1,

    // Convert array/object to JSON string for storage
    objectToString: (value: any): string =>
    {
        if (!value) return '';
        return JSON.stringify(value);
    },

    // Convert JSON string from SQLite to object
    stringToObject: (value: string): any =>
    {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Error parsing JSON from database:', e);
            return null;
        }
    }
};
