import { theme } from "@/theme/theme";
import { ActionType } from "../types/action";
import { ConfigManager } from "../models/ConfigManager";
import { Icon } from "@ui-kitten/components";
import { Image } from "react-native";

// In-memory cache of action types
let actionTypesCache: ActionType[] | null = null;

/**
 * @description 根据action的名称获取Icon的名称和颜色
 * @param actionName 行为名称
 * @returns Icon information with either named icon or custom image
 */
export async function getIconAndColor(actionName: string, size: number = 24, color?: string): Promise<React.ReactNode>
{
    // Load action types if not cached
    if (!actionTypesCache) {
        try {
            actionTypesCache = await ConfigManager.getInstance().getActionTypes();
        } catch (error) {
            console.error('Failed to load action types:', error);
            // Return default if failed to load
            return <Icon name="radio-button-on-outline" size={size} color={color} pack={undefined} />;
        }
    }

    // Find matching action type
    const actionType = actionTypesCache.find(type => type.name === actionName);
    if (actionType) {
        if (actionType.useCustomImage) {
            return <Image source={{ uri: actionType.iconImage }} style={{ width: size, height: size }} />;
        }
        return <Icon name={actionType.iconName} size={size} color={color} pack={actionType.pack} />;
    }

    // Return default if not found
    return <Icon name="radio-button-on-outline" size={size} color={color} pack={undefined} />;
}

/**
 * Clears the action types cache, forcing a reload on next use
 */
export function clearActionTypesCache()
{
    actionTypesCache = null;
}