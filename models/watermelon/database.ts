import { Database, DatabaseAdapter } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'; // Web adapter
import { Platform, NativeModules } from 'react-native';
import { schema } from './schema';
import { Plant } from './Plant';
import { Action } from './Action';
import migrations from './migrations';

export let database: Database;

// Check if WMDatabaseBridge is available
const isWatermelonDBNativeAvailable = () =>
{
    try {
        return !!NativeModules.WMDatabaseBridge;
    } catch (e) {
        return false;
    }
};

const asyncLoadSqliteAdapter = async () =>
{
    try {
        // Check if the native module is available
        const isAvailable = isWatermelonDBNativeAvailable();
        console.log("Checking for WMDatabaseBridge:", isAvailable ? "Available" : "Not available");

        if (!isAvailable) {
            throw new Error("WatermelonDB native module is not available. Using Expo Go? Native modules require a development build.");
        }

        console.log("SQLiteAdapter loaded successfully");

        // Always disable JSI for stability until properly setup
        const jsiEnabled = false;
        console.log("JSI enabled:", jsiEnabled);

        const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite');
        return new SQLiteAdapter({
            schema,
            migrations,
            dbName: 'small_garden',
            jsi: jsiEnabled,
            onSetUpError: (error: any) =>
            {
                console.error('Failed to setup database:', error);
            }
        });
    } catch (error) {
        console.error("SQLite adapter not available:", error);
        throw error;
    }
}

export const DatabaseInstance = {
    getInstance: () => database,
    init: async () =>
    {
        console.log("Initializing database...");
        return new Promise<void>(async (resolve, reject) =>
        {
            try {
                let adapter: DatabaseAdapter;

                // Use LokiJS for web or if WMDatabaseBridge is not available
                if (Platform.OS === "web" || !isWatermelonDBNativeAvailable()) {
                    if (Platform.OS === "web") {
                        console.log("Using LokiJS adapter for web platform");
                    } else {
                        console.log("WMDatabaseBridge not available, using LokiJS adapter as fallback");
                        console.log("To use SQLite (better performance), create a development build with: npx expo run:android");
                    }

                    adapter = new LokiJSAdapter({
                        schema,
                        migrations,
                        useWebWorker: false,
                        useIncrementalIndexedDB: true,
                    });
                } else {
                    try {
                        console.log("Attempting to use SQLite adapter for mobile");
                        adapter = await asyncLoadSqliteAdapter();
                    } catch (adapterError) {
                        console.log("SQLite adapter not available, falling back to LokiJS");
                        adapter = new LokiJSAdapter({
                            schema,
                            migrations,
                            useWebWorker: false,
                            useIncrementalIndexedDB: true,
                        });
                    }
                }

                console.log("Creating database with adapter");
                database = new Database({
                    adapter,
                    modelClasses: [
                        Plant,
                        Action
                    ]
                });
                console.log("Database initialized successfully");
                resolve();
            } catch (error) {
                console.error("Database initialization failed:", error);
                reject(error);
            }
        });
    },
    close: async () =>
    {
        // WatermelonDB handles connection lifecycle automatically
        return Promise.resolve();
    }
};