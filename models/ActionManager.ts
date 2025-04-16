import { Platform } from 'react-native';
import { Action } from '../types/action';
import { Action as SQLiteAction } from './sqlite/Action';

export class ActionManager
{
    static async addAction(action: Action)
    {
        if (Platform.OS === 'web') {
            mockActions.push(action);
            return true;
        }
        return await SQLiteAction.create(action);
    }

    static async updateAction(action: Action)
    {
        if (Platform.OS === 'web') {
            const index = mockActions.findIndex(item => item.id === action.id);
            if (index !== -1) {
                mockActions[index] = action;
            }
            return;
        }
        await SQLiteAction.update(action);
    }

    static async deleteAction(id: string)
    {
        if (Platform.OS === 'web') {
            const index = mockActions.findIndex(item => item.id === id);
            if (index !== -1) {
                mockActions.splice(index, 1);
            }
            return;
        }
        await SQLiteAction.delete(id);
    }

    static async getAction(id: string): Promise<Action | null>
    {
        if (Platform.OS === 'web') {
            return mockActions.find(item => item.id === id) || null;
        }
        return await SQLiteAction.findById(id);
    }

    static async getAllActions(): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions;
        }
        return await SQLiteAction.findAll();
    }

    static async getActionsByPlantId(plantId: string): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions.filter(item => item.plantId === plantId);
        }
        return await SQLiteAction.findByPlantId(plantId);
    }

    static async getActionsByTimeRange(startTime: number, endTime: number): Promise<Action[]>
    {
        if (Platform.OS === 'web') {
            return mockActions.filter(item => item.time >= startTime && item.time <= endTime);
        }
        return await SQLiteAction.findByTimeRange(startTime, endTime);
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

        return await SQLiteAction.findLastAndNextAction(plantId);
    }

}

const mockActions: Action[] = [
    {
        id: '11',
        name: '浇水',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
        done: true,
    },
    {
        id: '1',
        name: '施肥',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
        done: true,
    },
    {
        id: '2',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: '3',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: '4',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: '5',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
    {
        id: '6',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
        done: true,
    },
];