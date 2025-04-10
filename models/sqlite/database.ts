import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export let database: SQLite.SQLiteDatabase;

export const DatabaseInstance = {
    getInstance: () => database,
    init: async () => {
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
                    FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
                );
                
                CREATE INDEX IF NOT EXISTS idx_actions_plant_id ON actions (plant_id);
            `);
            
            console.log("SQLite database initialized successfully");
            return Promise.resolve();
        } catch (error) {
            console.error("Database initialization failed:", error);
            return Promise.reject(error);
        }
    },
    close: async () => {
        if (database) {
            await database.closeAsync();
        }
        return Promise.resolve();
    }
};

// Helper functions for converting between JS types and SQLite types
export const sqliteHelpers = {
    // Convert boolean to SQLite INTEGER (0 or 1)
    boolToInt: (value: boolean): number => value ? 1 : 0,
    
    // Convert SQLite INTEGER to boolean
    intToBool: (value: number): boolean => value === 1,
    
    // Convert array/object to JSON string for storage
    objectToString: (value: any): string => {
        if (!value) return '';
        return JSON.stringify(value);
    },
    
    // Convert JSON string from SQLite to object
    stringToObject: (value: string): any => {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Error parsing JSON from database:', e);
            return null;
        }
    }
};
