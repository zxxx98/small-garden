import { Action as ActionType } from '../../types/action';
import { database, sqliteHelpers } from './database';

type ActionDB = {
    id: string;
    name: string;
    plant_id: string;
    time: number;
    remark: string | null;
    imgs: string | null;
}

function actionDBToActionType(actionDB: ActionDB): ActionType {
    return {
        id: actionDB.id,
        name: actionDB.name,
        plantId: actionDB.plant_id,
        time: actionDB.time,
        remark: actionDB.remark || '',
        imgs: actionDB.imgs ? JSON.parse(actionDB.imgs) : []
    };
}

export class Action {
    static async findById(id: string): Promise<ActionType | null> {
        try {
            const result = await database.getFirstAsync<ActionDB>('SELECT * FROM actions WHERE id = ?', id);

            if (!result) return null;

            return actionDBToActionType(result);
        } catch (error) {
            console.error('Error finding action by ID:', error);
            return null;
        }
    }

    static async findAll(): Promise<ActionType[]> {
        try {
            const results = await database.getAllAsync<ActionDB>('SELECT * FROM actions');

            return results.map(row => actionDBToActionType(row));
        } catch (error) {
            console.error('Error finding all actions:', error);
            return [];
        }
    }

    static async findByPlantId(plantId: string): Promise<ActionType[]> {
        try {
            const results = await database.getAllAsync<ActionDB>('SELECT * FROM actions WHERE plant_id = ?', plantId);

            return results.map(row => actionDBToActionType(row));
        } catch (error) {
            console.error('Error finding actions by plant ID:', error);
            return [];
        }
    }

    static async findByTimeRange(startTime: number, endTime: number): Promise<ActionType[]> {
        try {
            const results = await database.getAllAsync<ActionDB>('SELECT * FROM actions WHERE time >= ? AND time <= ?', startTime, endTime);

            return results.map(row => actionDBToActionType(row));
        } catch (error) {
            console.error('Error finding actions by time range:', error);
            return [];
        }
    }

    static async create(action: ActionType): Promise<boolean> {
        try {
            const result = await database.runAsync(
                'INSERT INTO actions (id, name, plant_id, time, remark, imgs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                String(action.id),
                action.name,
                action.plantId,
                action.time,
                action.remark || null,
                action.imgs ? JSON.stringify(action.imgs) : null,
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error creating action:', error);
            return false;
        }
    }

    static async update(action: ActionType): Promise<boolean> {
        try {
            const result = await database.runAsync(
                'UPDATE actions SET name = ?, plant_id = ?, time = ?, remark = ?, imgs = ? WHERE id = ?',
                action.name,
                action.plantId,
                action.time,
                action.remark || null,
                action.imgs ? JSON.stringify(action.imgs) : null,
                String(action.id)
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error updating action:', error);
            return false;
        }
    }

    static async delete(id: string): Promise<boolean> {
        try {
            const result = await database.runAsync('DELETE FROM actions WHERE id = ?', id);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting action:', error);
            return false;
        }
    }

    static async findLastAction(plantId: string): Promise<ActionType | null> {
        try {
            const now = Date.now();

            // Find last action
            const lastActionResult = await database.getFirstAsync<ActionDB>('SELECT * FROM actions WHERE plant_id = ? AND time <= ? ORDER BY time DESC LIMIT 1', plantId, now);

            const lastAction = lastActionResult ? {
                id: lastActionResult.id,
                name: lastActionResult.name,
                plantId: lastActionResult.plant_id,
                time: lastActionResult.time,
                remark: lastActionResult.remark || '',
                imgs: lastActionResult.imgs ? JSON.parse(lastActionResult.imgs) : []
            } : null;

            return lastAction;
        } catch (error) {
            return null;
        }
    }
}
