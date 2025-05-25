import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionNameKey, ThemeModeKey, CategoriesKey, ActionTypesKey, R2ConfigKey, UseR2StorageKey, R2Config, PlantNetApiKeyKey, AreasKey, Area } from '../types/config';
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
    { name: "浇水", iconName: "watering-can-outline", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "施肥", iconName: "flower-pollen-outline", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "授粉", iconName: "bee-flower", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "换盆", iconName: "pot", color: theme["color-success-500"], pack: "materialCommunityIcons", useCustomImage: false },
    { name: "修剪", iconName: "scissors", color: theme["color-success-500"], pack: "feather", useCustomImage: false },
    { name: "除虫", iconName: "bug-sharp", color: theme["color-success-500"], pack: "ionicons", useCustomImage: false },
    { name: "拍照", iconName: "camera", color: theme["color-success-500"], pack: "feather", useCustomImage: false },
];

// Default areas
const defaultAreas: Area[] = [
    { id: '0', name: '默认' },
    { id: '1', name: '阳台' },
    { id: '2', name: '客厅' },
    { id: '3', name: '书房' },
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

    public async addCategory(category: Category): Promise<void>
    {
        const categories = await this.getCategories();
        categories.push(category);
        await this.saveCategories(categories);
    }

    public async updateCategory(category: Category): Promise<void>
    {
        const categories = await this.getCategories();
        const index = categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
            categories[index] = category;
            await this.saveCategories(categories);
        }
    }

    public async deleteCategory(categoryId: string): Promise<void>
    {
        const categories = await this.getCategories();
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categories.splice(index, 1);
            await this.saveCategories(categories);
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

    public async addActionType(actionType: ActionType): Promise<void>
    {
        const actionTypes = await this.getActionTypes();
        actionTypes.push(actionType);
        await this.saveActionTypes(actionTypes);
    }

    public async updateActionType(actionType: ActionType): Promise<void>
    {
        const actionTypes = await this.getActionTypes();
        const index = actionTypes.findIndex(at => at.name === actionType.name);
        if (index !== -1) {
            actionTypes[index] = actionType;
            await this.saveActionTypes(actionTypes);
        }
    }

    public async deleteActionType(actionTypeName: string): Promise<void>
    {
        const actionTypes = await this.getActionTypes();
        const index = actionTypes.findIndex(at => at.name === actionTypeName);
        if (index !== -1) {
            actionTypes.splice(index, 1);
            await this.saveActionTypes(actionTypes);
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

    public async getR2Config(): Promise<R2Config | null>
    {
        try {
            const configString = await AsyncStorage.getItem(R2ConfigKey);
            if (configString) {
                return JSON.parse(configString);
            }
            return null;
        } catch (error) {
            console.error('Failed to get R2 config:', error);
            return null;
        }
    }

    public async saveR2Config(config: R2Config): Promise<void>
    {
        try {
            await AsyncStorage.setItem(R2ConfigKey, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save R2 config:', error);
            throw new Error('Failed to save R2 configuration');
        }
    }

    public async getUseR2Storage(): Promise<boolean>
    {
        try {
            const value = await AsyncStorage.getItem(UseR2StorageKey);
            return value === 'true';
        } catch (error) {
            console.error('Failed to get R2 storage toggle:', error);
            return false; // Default to false/local storage
        }
    }

    public async setUseR2Storage(value: boolean): Promise<void>
    {
        try {
            await AsyncStorage.setItem(UseR2StorageKey, value ? 'true' : 'false');
        } catch (error) {
            console.error('Failed to set R2 storage toggle:', error);
            throw new Error('Failed to save R2 storage preference');
        }
    }

    public async getPlantNetApiKey(): Promise<string | null>
    {
        try {
            return await AsyncStorage.getItem(PlantNetApiKeyKey);
        } catch (error) {
            console.error('Failed to get PlantNet API key:', error);
            return null;
        }
    }

    public async setPlantNetApiKey(value: string): Promise<void>
    {
        try {
            await AsyncStorage.setItem(PlantNetApiKeyKey, value);
        } catch (error) {
            console.error('Error setting PlantNet API key:', error);
            throw error;
        }
    }

    // 获取所有区域
    public async getAreas(): Promise<Area[]>
    {
        try {
            const areasJson = await AsyncStorage.getItem(AreasKey);
            if (areasJson) {
                return JSON.parse(areasJson);
            }
            // 如果没有区域数据，返回默认区域
            await this.saveAreas(defaultAreas);
            return defaultAreas;
        } catch (error) {
            console.error('Error getting areas:', error);
            return defaultAreas;
        }
    }

    // 保存所有区域
    public async saveAreas(areas: Area[]): Promise<void>
    {
        try {
            await AsyncStorage.setItem(AreasKey, JSON.stringify(areas));
        } catch (error) {
            console.error('Error saving areas:', error);
            throw error;
        }
    }

    // 添加区域
    public async addArea(area: Area): Promise<void>
    {
        try {
            const areas = await this.getAreas();
            // 检查是否已存在同名区域
            if (areas.some(a => a.name === area.name)) {
                throw new Error('区域名称已存在');
            }
            areas.push(area);
            await this.saveAreas(areas);
        } catch (error) {
            console.error('Error adding area:', error);
            throw error;
        }
    }

    // 更新区域
    public async updateArea(area: Area): Promise<void>
    {
        try {
            const areas = await this.getAreas();
            const index = areas.findIndex(a => a.id === area.id);
            if (index === -1) {
                throw new Error('区域不存在');
            }
            // 检查是否与其他区域重名
            if (areas.some(a => a.id !== area.id && a.name === area.name)) {
                throw new Error('区域名称已存在');
            }
            areas[index] = area;
            await this.saveAreas(areas);
        } catch (error) {
            console.error('Error updating area:', error);
            throw error;
        }
    }

    // 删除区域
    public async deleteArea(areaId: string): Promise<void>
    {
        try {
            const areas = await this.getAreas();
            const updatedAreas = areas.filter(area => area.id !== areaId);
            await this.saveAreas(updatedAreas);
        } catch (error) {
            console.error('Error deleting area:', error);
            throw error;
        }
    }
}