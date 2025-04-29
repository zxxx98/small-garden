export type Plant = {
    id: string,
    //名称
    name: string,
    //植物类型
    type: string,
    //学名
    scientificName: string | null,
    //描述
    description: string,
    //图片
    img: string,
    //是否死亡
    isDead: boolean,
    //todo列表
    todos: Todo[],
    //区域id 默认为0
    areaId: string,
}

export type Todo = {
    //植物id
    plantId: string,
    //是否是循环任务
    isRecurring: boolean,
    //任务名称
    actionName: string,
    //循环的单位 天/周/月
    recurringUnit: string,
    //循环的间隔
    recurringInterval: number,
    //下次提醒开始的时间
    nextRemindTime: number,
    //备注
    remark: string,
};