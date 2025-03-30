import { theme } from "@/theme/theme";

/**
 * @description 根据action的名称获取Icon的名称和颜色
 * @param actionName 行为名称
 * @returns { icon: string; color: string } icon名称和颜色
 */
export function getIconAndColor(actionName: string)
{
    if (actionName in ActionIconMap) {
        return ActionIconMap[actionName];
    }
    return { iconName: "radio-button-on-outline", color: theme["color-purple-500"], pack: undefined };
}

const ActionIconMap: { [key: string]: { iconName: string, color: string, pack?: string } } = {
    "浇水": { iconName: "water-outline", color: theme["color-primary-500"], pack: "ionicons" },
    "施肥": { iconName: "flower-pollen-outline", color: theme["color-success-500"], pack: "materialCommunityIcons" },
    "授粉": { iconName: "bee-flower", color: theme["color-primary-500"], pack: "materialCommunityIcons" },
    "种植": { iconName: "seed-outline", color: theme["color-success-500"], pack: "materialCommunityIcons" },
    "修剪": { iconName: "scissors", color: theme["color-success-500"], pack: "feather" },
    "拔除": { iconName: "emoticon-dead-outline", color: theme["color-primary-500"], pack: "materialCommunityIcons" },
    "除草": { iconName: "grass", color: theme["color-success-500"], pack: "materialCommunityIcons" },
}