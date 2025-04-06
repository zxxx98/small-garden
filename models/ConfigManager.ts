import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionNameKey, ThemeModeKey, CategoriesKey, ActionTypesKey } from '../types/config';
import { Category } from '../context/CategoryContext';
import { theme } from '@/theme/theme';
import { ActionType } from '@/types/action';

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

// Default action types
const defaultActionTypes: ActionType[] = [
    { name: "浇水", iconName: "droplet-outline", color: theme["color-purple-300"], useCustomImage: false },
    { name: "施肥", iconName: "flower-pollen-outline", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "授粉", iconName: "bee-flower", color: theme["color-primary-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "种植", iconName: "seed-outline", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "修剪", iconName: "scissors", color: theme["color-success-500"], pack: "feather", useCustomImage: false },
    { name: "拔除", iconName: "emoticon-dead-outline", color: theme["color-primary-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "除草", iconName: "grass", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
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

    public async getActionTypes(): Promise<ActionType[]>
    {
        try {
            const storedActionTypes = await AsyncStorage.getItem(ActionTypesKey);
            if (storedActionTypes) {
                return JSON.parse(storedActionTypes);
            }
            // If no action types stored, use and save default action types
            await this.saveActionTypes(defaultActionTypes);
            return defaultActionTypes;
        } catch (error) {
            console.error('Failed to get action types:', error);
            throw new Error('Failed to load action types');
        }
    }

    public async saveActionTypes(actionTypes: ActionType[]): Promise<void>
    {
        try {
            await AsyncStorage.setItem(ActionTypesKey, JSON.stringify(actionTypes));
        } catch (error) {
            console.error('Failed to save action types:', error);
            throw new Error('Failed to save action types');
        }
    }
}