import { DatabaseInstance } from "./models/sqlite/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rootStore } from './stores/RootStore';
import './utils/errorHandler';  // 导入错误处理器

export default async function init() {
    try {
        // Initialize the database
        await DatabaseInstance.init();
        // 如果数据库版本发生变化，则重置数据库
        // await DatabaseInstance.resetSchema();
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