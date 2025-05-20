import { DatabaseInstance } from "./models/sqlite/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rootStore } from './stores/RootStore';
import './utils/errorHandler';  // 导入错误处理器

export default async function init() {
    try {
        // Initialize the database
        await DatabaseInstance.init();

        // Check if this is first run after update
        const lastVersion = await AsyncStorage.getItem('app_last_version');
        const currentVersion = '1.0.1'; // Update this when making database schema changes

        if (lastVersion !== currentVersion) {
            console.log(`Version change detected: ${lastVersion} -> ${currentVersion}`);
            // Reset schema to fix any database structure issues
            await DatabaseInstance.resetSchema();
            // Save the current version
            await AsyncStorage.setItem('app_last_version', currentVersion);
            console.log('Database schema reset due to version change');
        }
        await rootStore.init();
        return Promise.resolve();
    } catch (error) {
        console.error("Initialization error:", error);
        // If there was an error in initialization, try resetting the schema
        try {
            console.log("Attempting to reset schema due to initialization error");
            await DatabaseInstance.resetSchema();
            return Promise.resolve();
        } catch (resetError) {
            console.error("Failed to reset schema:", resetError);
            return Promise.reject(resetError);
        }
    }
}