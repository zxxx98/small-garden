import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionNameKey, ThemeModeKey } from '../types/config';

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
}