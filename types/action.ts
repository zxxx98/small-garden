/**
 * 行为 （例如：浇水，施肥，打侧枝...）
 */
export type Action = {
    id: string,
    //名称
    name: string,
    //植物id
    plantId: string,
    //时间戳
    time: number,
    //简介
    remark: string,
    //记录图片数组
    imgs: string[]
};

// 行为类型定义
export type ActionType = {
    name: string;
    // Icon can be either a named icon or a custom image
    iconName?: string;
    iconImage?: string; // Base64 string or file URI for custom image
    color: string;
    pack?: string;
    // Flag to distinguish between icon types
    useCustomImage?: boolean;
};