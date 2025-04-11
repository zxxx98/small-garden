//行为名称储存Key
export const ActionNameKey = "ActionName";
//主题模式储存Key
export const ThemeModeKey = "ThemeMode";
//植物类别储存Key
export const CategoriesKey = "plant_categories";
//行为类型储存Key
export const ActionTypesKey = "action_types";
//R2存储配置Key
export const R2ConfigKey = "r2_config";
//R2存储开关Key
export const UseR2StorageKey = "use_r2_storage";

/**
 * Cloudflare R2 配置接口
 */
export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}