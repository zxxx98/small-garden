import { Platform } from 'react-native';
import { Action } from '../types/action';
import { database } from './watermelon/database';
import { Action as WatermelonAction } from './watermelon/Action';
import { Q } from '@nozbe/watermelondb';

export class ActionManager
{
    static async addAction(action: Action)
    {
        if (Platform.OS === 'web') {
            mockActions.push(action);
            return true;
        }
        await database.write(async () =>
        {
            await database.get<WatermelonAction>('actions').create(record =>
            {
                record._raw.id = String(action.id);
                record.name = action.name;
                (record._raw as any).plant_id = action.plantId;
                record.time = action.time;
                record.remark = action.remark;
                record.imgs = JSON.stringify(action.imgs);
                record.done = action.done;
            });
        });
        return true;
    }

    static async updateAction(action: Action)
    {
        if (Platform.OS === 'web') {
            const index = mockActions.findIndex(item => item.id === action.id);
            if (index !== -1) {
                mockActions[index] = action;
            }
        }
        const record = await database.get<WatermelonAction>('actions').find(String(action.id));
        await database.write(async () =>
        {
            await record.update(item =>
            {
                item.name = action.name;
                (record._raw as any).plant_id = action.plantId;
                item.time = action.time;
                item.remark = action.remark;
                item.imgs = JSON.stringify(action.imgs);
                item.done = action.done;
            });
        });
    }

    static async deleteAction(id: number)
    {
        if (Platform.OS === 'web') {
            const index = mockActions.findIndex(item => item.id === id);
            if (index !== -1) {
                mockActions.splice(index, 1);
            }
        }
        const record = await database.get<WatermelonAction>('actions').find(String(id));
        await database.write(async () =>
        {
            await record.destroyPermanently();
        });
    }

    static async getAction(id: number): Promise<Action | null>
    {
        if (Platform.OS === 'web') {
            return mockActions.find(item => item.id === id) || null;
        }
        try {
            const record = await database.get<WatermelonAction>('actions').find(String(id));
            return record.toJSON() as Action;
        } catch (error) {
            return null;
        }
    }

    static async getAllActions(): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions;
        }
        const records = await database.get<WatermelonAction>('actions').query().fetch();
        return records.map(record => record.toJSON() as Action);
    }

    static async getActionsByPlantId(plantId: string): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions.filter(item => item.plantId === plantId);
        }
        const records = await database.get<WatermelonAction>('actions')
            .query(Q.where('plant_id', plantId))
            .fetch();
        return records.map(record => record.toJSON() as Action);
    }
}

const mockActions: Action[] = [
    {
        id: 1,
        name: '浇水',
        plantId: '3', // 绿萝
        time: 1672531200000, // 2023-01-01
        remark: '土壤干燥，浇透水',
        imgs: [''],
        done: true,
    },
    {
        id: 2,
        name: '施肥',
        plantId: '5', // 银杏
        time: 1672617600000, // 2023-01-02
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: 3,
        name: '打侧枝',
        plantId: '10', // 玫瑰
        time: 1672704000000, // 2023-01-03
        remark: '修剪过密侧枝促进主枝生长',
        imgs: [''],
        done: false,
    },
    {
        id: 4,
        name: '换盆',
        plantId: '1', // 豌豆
        time: 1672790400000, // 2023-01-04
        remark: '换到大号花盆',
        imgs: [''],
        done: true,
    },
    {
        id: 5,
        name: '除虫',
        plantId: '7', // 薰衣草
        time: 1672876800000, // 2023-01-05
        remark: '发现蚜虫，喷洒杀虫剂',
        imgs: [''],
        done: true,
    },
    {
        id: 6,
        name: '松土',
        plantId: '2', // 月季
        time: 1672963200000, // 2023-01-06
        remark: '表层土壤板结',
        imgs: [''],
        done: false,
    },
    {
        id: 7,
        name: '支架固定',
        plantId: '4', // 番茄
        time: 1673049600000, // 2023-01-07
        remark: '植株倒伏，用竹竿支撑',
        imgs: [''],
        done: true,
    },
    {
        id: 8,
        name: '播种',
        plantId: '8', // 向日葵
        time: 1673136000000, // 2023-01-08
        remark: '春季播种计划',
        imgs: [''],
        done: false,
    },
    {
        id: 9,
        name: '修剪枯叶',
        plantId: '6', // 仙人掌
        time: 1673222400000, // 2023-01-09
        remark: '去除底部发黄叶片',
        imgs: [''],
        done: true,
    },
    {
        id: 10,
        name: '冬季防护',
        plantId: '9', // 竹子
        time: 1673308800000, // 2023-01-10
        remark: '包裹防寒布过冬',
        imgs: [''],
        done: false,
    }
];