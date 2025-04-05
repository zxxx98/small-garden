import { Database, DatabaseAdapter } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'; // Web adapter
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'; // Mobile adapter
import { Platform, NativeModules } from 'react-native';
import { schema } from './schema';
import { Plant } from './Plant';
import { Action } from './Action';
import migrations from './migrations';

export let database: Database;

const asyncLoadSqliteAdapter = async () =>
{
    try {
        // Check if the native module is available
        console.log("Checking for WMDatabaseBridge:", NativeModules.WMDatabaseBridge ? "Available" : "Not available");

        if (!NativeModules.WMDatabaseBridge) {
            throw new Error("WatermelonDB native module is not available. Using Expo Go? Native modules require a development build.");
        }

        console.log("SQLiteAdapter loaded successfully");

        // Always disable JSI for stability until properly setup
        const jsiEnabled = false;
        console.log("JSI enabled:", jsiEnabled);

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

                if (Platform.OS === "web") {
                    console.log("Using LokiJS adapter for web platform");
                    adapter = new LokiJSAdapter({
                        schema,
                        migrations,
                        useWebWorker: false,
                        useIncrementalIndexedDB: true,
                    });
                } else {
                    try {
                        console.log("Attempting to use SQLite adapter for mobile");
                        adapter = new SQLiteAdapter({
                            schema,
                            migrations,
                            dbName: 'small_garden',
                            jsi: false,
                            onSetUpError: (error: any) =>
                            {
                                console.error('Failed to setup database:', error);
                            }
                        });
                    } catch (adapterError) {
                        console.log("SQLite adapter not available, this is expected when using Expo Go.");
                        console.log("To use SQLite (better performance), create a development build with: npx expo run:android");

                        console.log("Using LokiJS adapter as fallback for development");
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