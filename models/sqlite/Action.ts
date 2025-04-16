import { Action as ActionType } from '../../types/action';
import { database, sqliteHelpers } from './database';

export class Action
{
    static async findById(id: string): Promise<ActionType | null>
    {
        try {
            const result = await database.getFirstAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions WHERE id = ?', id);

            if (!result) return null;

            return {
                id: result.id,
                name: result.name,
                plantId: result.plant_id,
                time: result.time,
                remark: result.remark || '',
                imgs: result.imgs ? JSON.parse(result.imgs) : [],
                done: sqliteHelpers.intToBool(result.done),
                isRecurring: result.is_recurring ? sqliteHelpers.intToBool(result.is_recurring) : undefined,
                recurringInterval: result.recurring_interval ? result.recurring_interval : undefined,
                parentRecurringId: result.parent_recurring_id ? result.parent_recurring_id : undefined
            };
        } catch (error) {
            console.error('Error finding action by ID:', error);
            return null;
        }
    }

    static async findAll(): Promise<ActionType[]>
    {
        try {
            const results = await database.getAllAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions');

            return results.map(row => ({
                id: row.id,
                name: row.name,
                plantId: row.plant_id,
                time: row.time,
                remark: row.remark || '',
                imgs: row.imgs ? JSON.parse(row.imgs) : [],
                done: sqliteHelpers.intToBool(row.done),
                isRecurring: row.is_recurring ? sqliteHelpers.intToBool(row.is_recurring) : undefined,
                recurringInterval: row.recurring_interval ? row.recurring_interval : undefined,
                parentRecurringId: row.parent_recurring_id ? row.parent_recurring_id : undefined
            }));
        } catch (error) {
            console.error('Error finding all actions:', error);
            return [];
        }
    }

    static async findByPlantId(plantId: string): Promise<ActionType[]>
    {
        try {
            const results = await database.getAllAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions WHERE plant_id = ?', plantId);

            return results.map(row => ({
                id: row.id,
                name: row.name,
                plantId: row.plant_id,
                time: row.time,
                remark: row.remark || '',
                imgs: row.imgs ? JSON.parse(row.imgs) : [],
                done: sqliteHelpers.intToBool(row.done),
                isRecurring: row.is_recurring ? sqliteHelpers.intToBool(row.is_recurring) : undefined,
                recurringInterval: row.recurring_interval ? row.recurring_interval : undefined,
                parentRecurringId: row.parent_recurring_id ? row.parent_recurring_id : undefined
            }));
        } catch (error) {
            console.error('Error finding actions by plant ID:', error);
            return [];
        }
    }

    static async findByTimeRange(startTime: number, endTime: number): Promise<ActionType[]>
    {
        try {
            const results = await database.getAllAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions WHERE time >= ? AND time <= ?', startTime, endTime);

            return results.map(row => ({
                id: row.id,
                name: row.name,
                plantId: row.plant_id,
                time: row.time,
                remark: row.remark || '',
                imgs: row.imgs ? JSON.parse(row.imgs) : [],
                done: sqliteHelpers.intToBool(row.done),
                isRecurring: row.is_recurring ? sqliteHelpers.intToBool(row.is_recurring) : undefined,
                recurringInterval: row.recurring_interval ? row.recurring_interval : undefined,
                parentRecurringId: row.parent_recurring_id ? row.parent_recurring_id : undefined
            }));
        } catch (error) {
            console.error('Error finding actions by time range:', error);
            return [];
        }
    }

    static async create(action: ActionType): Promise<boolean>
    {
        try {
            const result = await database.runAsync(
                'INSERT INTO actions (id, name, plant_id, time, remark, imgs, done, is_recurring, recurring_interval, parent_recurring_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                String(action.id),
                action.name,
                action.plantId,
                action.time,
                action.remark || null,
                action.imgs ? JSON.stringify(action.imgs) : null,
                sqliteHelpers.boolToInt(action.done),
                action.isRecurring !== undefined ? sqliteHelpers.boolToInt(action.isRecurring) : null,
                action.recurringInterval || null,
                action.parentRecurringId ? action.parentRecurringId : null
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error creating action:', error);
            return false;
        }
    }

    static async update(action: ActionType): Promise<boolean>
    {
        try {
            const result = await database.runAsync(
                'UPDATE actions SET name = ?, plant_id = ?, time = ?, remark = ?, imgs = ?, done = ?, is_recurring = ?, recurring_interval = ?, parent_recurring_id = ? WHERE id = ?',
                action.name,
                action.plantId,
                action.time,
                action.remark || null,
                action.imgs ? JSON.stringify(action.imgs) : null,
                sqliteHelpers.boolToInt(action.done),
                action.isRecurring !== undefined ? sqliteHelpers.boolToInt(action.isRecurring) : null,
                action.recurringInterval || null,
                action.parentRecurringId ? action.parentRecurringId : null,
                String(action.id)
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error updating action:', error);
            return false;
        }
    }

    static async delete(id: string): Promise<boolean>
    {
        try {
            const result = await database.runAsync('DELETE FROM actions WHERE id = ?', id);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting action:', error);
            return false;
        }
    }

    static async findLastAndNextAction(plantId: string): Promise<{ lastAction: ActionType | null, nextAction: ActionType | null }>
    {
        try {
            const now = Date.now();

            // Find last action
            const lastActionResult = await database.getFirstAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions WHERE plant_id = ? AND time <= ? ORDER BY time DESC LIMIT 1', plantId, now);

            // Find next action
            const nextActionResult = await database.getFirstAsync<{
                id: string;
                name: string;
                plant_id: string;
                time: number;
                remark: string | null;
                imgs: string | null;
                done: number;
                is_recurring: number | null;
                recurring_interval: number | null;
                parent_recurring_id: string | null;
            }>('SELECT * FROM actions WHERE plant_id = ? AND time > ? ORDER BY time ASC LIMIT 1', plantId, now);

            const lastAction = lastActionResult ? {
                id: lastActionResult.id,
                name: lastActionResult.name,
                plantId: lastActionResult.plant_id,
                time: lastActionResult.time,
                remark: lastActionResult.remark || '',
                imgs: lastActionResult.imgs ? JSON.parse(lastActionResult.imgs) : [],
                done: sqliteHelpers.intToBool(lastActionResult.done),
                isRecurring: lastActionResult.is_recurring ? sqliteHelpers.intToBool(lastActionResult.is_recurring) : undefined,
                recurringInterval: lastActionResult.recurring_interval ? lastActionResult.recurring_interval : undefined,
                parentRecurringId: lastActionResult.parent_recurring_id ? lastActionResult.parent_recurring_id : undefined
            } : null;

            const nextAction = nextActionResult ? {
                id: nextActionResult.id,
                name: nextActionResult.name,
                plantId: nextActionResult.plant_id,
                time: nextActionResult.time,
                remark: nextActionResult.remark || '',
                imgs: nextActionResult.imgs ? JSON.parse(nextActionResult.imgs) : [],
                done: sqliteHelpers.intToBool(nextActionResult.done),
                isRecurring: nextActionResult.is_recurring ? sqliteHelpers.intToBool(nextActionResult.is_recurring) : undefined,
                recurringInterval: nextActionResult.recurring_interval ? nextActionResult.recurring_interval : undefined,
                parentRecurringId: nextActionResult.parent_recurring_id ? nextActionResult.parent_recurring_id : undefined
            } : null;

            return { lastAction, nextAction };
        } catch (error) {
            console.error('Error finding last and next action:', error);
            return { lastAction: null, nextAction: null };
        }
    }
}
