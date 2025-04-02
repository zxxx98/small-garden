import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionNameKey, ThemeModeKey, CategoriesKey } from '../types/config';
import { Category } from '../context/CategoryContext';

// Default categories
const defaultCategories: Category[] = [
    { id: '1', name: '多肉' },
    { id: '2', name: '玫瑰' },
    { id: '3', name: '月季' },
    { id: '4', name: '蔷薇' },
    { id: '5', name: '绣球' },
    { id: '6', name: '百合' },
    { id: '7', name: '郁金香' },
    { id: '8', name: '风信子' },
    { id: '9', name: '水仙' },
    { id: '10', name: '其他' },
];

export class ConfigManager
{
    private static instance: ConfigManager;

    private constructor() { }

    public static getInstance(): ConfigManager
    {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public async getActionName(): Promise<string | null>
    {
        try {
            return await AsyncStorage.getItem(ActionNameKey);
        } catch (error) {
            console.error('Failed to get action name:', error);
            return null;
        }
    }

    public async setActionName(value: string): Promise<void>
    {
        try {
            await AsyncStorage.setItem(ActionNameKey, value);
        } catch (error) {
            console.error('Failed to set action name:', error);
        }
    }

    public async getThemeMode(): Promise<string | null>
    {
        try {
            return await AsyncStorage.getItem(ThemeModeKey);
        } catch (error) {
            console.error('Failed to get theme mode:', error);
            return null;
        }
    }

    public async setThemeMode(value: string): Promise<void>
    {
        try {
            await AsyncStorage.setItem(ThemeModeKey, value);
        } catch (error) {
            console.error('Failed to set theme mode:', error);
        }
    }

    public async getCategories(): Promise<Category[]>
    {
        try {
            const storedCategories = await AsyncStorage.getItem(CategoriesKey);
            if (storedCategories) {
                return JSON.parse(storedCategories);
            }
            // If no categories stored, use and save default categories
            await this.saveCategories(defaultCategories);
            return defaultCategories;
        } catch (error) {
            console.error('Failed to get categories:', error);
            throw new Error('Failed to load categories');
        }
    }

    public async saveCategories(categories: Category[]): Promise<void>
    {
        try {
            await AsyncStorage.setItem(CategoriesKey, JSON.stringify(categories));
        } catch (error) {
            console.error('Failed to save categories:', error);
            throw new Error('Failed to save categories');
        }
    }
}