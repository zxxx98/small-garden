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
}

const mockActions: Action[] = [
    {
        id: '11',
        name: '浇水',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
    },
    {
        id: '1',
        name: '施肥',
        plantId: '3', // 绿萝
        time: new Date().getTime(),
        remark: '土壤干燥，浇透水',
        imgs: ['https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/25/14/21/kenroku-en-garden-9492642_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg', 'https://cdn.pixabay.com/photo/2025/03/23/14/08/azaleas-9488835_1280.jpg'],
    },
    {
        id: '2',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
    },
    {
        id: '3',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
    },
    {
        id: '4',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
    },
    {
        id: '5',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
    },
    {
        id: '6',
        name: '施肥',
        plantId: '5', // 银杏
        time: new Date().getTime(),
        remark: '施用有机肥',
        imgs: [''],
    },
];