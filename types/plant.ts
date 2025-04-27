export type Plant = {
    id: string,
    //名称
    name: string,
    //类型
    type: string,
    //学名
    scientificName: string | null,
    //备注
    remark: string,
    //图片
    img: string,
    //是否死亡
    isDead: boolean,
}