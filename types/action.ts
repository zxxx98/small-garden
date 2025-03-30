/**
 * 行为 （例如：浇水，施肥，打侧枝...）
 */
export type Action = {
    id: number,
    //名称
    name: string,
    //植物id
    plantId: string,
    //时间戳
    time: number,
    //备注
    remark: string,
    //记录图片数组
    imgs: string[],
    //已完成
    done: boolean,
};