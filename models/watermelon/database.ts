import { Database, DatabaseAdapter } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'; // Web 端适配器
import { Platform } from 'react-native';
import { schema } from './schema';
import { Plant } from './Plant';
import { Action } from './Action';
import migrations from './migrations';

export let database: Database;

const asyncLoadSqliteAdapter = async () =>
{
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/lokijs');
    return new SQLiteAdapter({
        schema,
        migrations,
        dbName: 'small_garden',
        // Only for dev mode
        jsi: true,
        onSetUpError: (error: any) =>
        {
            console.error('Failed to setup database:', error);
        }
    });
}

export const DatabaseInstance = {
    getInstance: () => database,
    init: async () =>
    {
        return new Promise<void>(async (resolve, reject) =>
        {
            const adapter = Platform.OS === "web" ? new LokiJSAdapter({
                schema,
                migrations,
                useWebWorker: false,
                useIncrementalIndexedDB: true,
            }) : await asyncLoadSqliteAdapter();
            database = new Database({
                adapter,
                modelClasses: [
                    Plant,
                    Action
                ]
            });
            resolve
        });
    },
    close: async () =>
    {
        // WatermelonDB handles connection lifecycle automatically
        return Promise.resolve();
    }
};