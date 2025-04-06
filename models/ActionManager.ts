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
        console.log(records);
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

    static async getActionsByTimeRange(startTime: number, endTime: number): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions.filter(item => item.time >= startTime && item.time <= endTime);
        }
        const records = await database.get<WatermelonAction>('actions')
            .query(
                Q.and(
                    Q.where('time', Q.gte(startTime)),
                    Q.where('time', Q.lte(endTime))
                )
            )
            .fetch();
        return records.map(record => record.toJSON() as Action);
    }

    static async getLastAndNextAction(plantId: string): Promise<{ lastAction: Action | null, nextAction: Action | null }>
    {
        if (Platform.OS === 'web') {
            const now = Date.now();
            const actions = mockActions.filter(item => item.plantId === plantId);
            const lastAction = actions.filter(a => a.time <= now).sort((a, b) => b.time - a.time)[0] || null;
            const nextAction = actions.filter(a => a.time > now).sort((a, b) => a.time - b.time)[0] || null;
            return { lastAction, nextAction };
        }

        const now = Date.now();
        const lastActionRecord = await database.get<WatermelonAction>('actions')
            .query(
                Q.and(
                    Q.where('plant_id', plantId),
                    Q.where('time', Q.lte(now)),
                )
            )
            .extend(Q.sortBy('time', 'desc'))
            .fetch();

        const nextActionRecord = await database.get<WatermelonAction>('actions')
            .query(
                Q.and(
                    Q.where('plant_id', plantId),
                    Q.where('time', Q.gt(now))
                )
            )
            .extend(Q.sortBy('time', 'asc'))
            .fetch();

        return {
            lastAction: lastActionRecord[0]?.toJSON() as Action || null,
            nextAction: nextActionRecord[0]?.toJSON() as Action || null
        };
    }

}

const mockActions: Action[] = [
    {
        id: 11,
        name: '浇水',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
        done: true,
    },
    {
        id: 1,
        name: '施肥',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
        done: true,
    },
    {
        id: 2,
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: 3,
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: 4,
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: 5,
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: 6,
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
];