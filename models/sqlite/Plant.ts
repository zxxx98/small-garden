import { Plant as PlantType } from '../../types/plant';
import { database, sqliteHelpers } from './database';

type PlantDB = {
    id: string;
    name: string;
    type: string;
    scientific_name: string | null;
    description: string | null;
    img: string | null;
    is_dead: number;
    area_id: string | null;
    todos: string;
}

export class Plant
{
    static async findById(id: string): Promise<PlantType | null>
    {
        try {
            const result = await database.getFirstAsync<PlantDB>('SELECT * FROM plants WHERE id = ?', id);

            if (!result) return null;

            return {
                id: result.id,
                name: result.name,
                type: result.type,
                scientificName: result.scientific_name,
                description: result.description || '',
                img: result.img || '',
                isDead: sqliteHelpers.intToBool(result.is_dead),
                todos: result.todos ? JSON.parse(result.todos) : [],
                areaId: result.area_id || '0'
            };
        } catch (error) {
            console.error('Error finding plant by ID:', error);
            return null;
        }
    }

    static async findAll(): Promise<PlantType[]>
    {
        try {
            const results = await database.getAllAsync<PlantDB>('SELECT * FROM plants');

            return results.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                scientificName: row.scientific_name,
                description: row.description || '',
                img: row.img || '',
                isDead: sqliteHelpers.intToBool(row.is_dead),
                todos: row.todos ? JSON.parse(row.todos) : [],
                areaId: row.area_id || '0'
            }));
        } catch (error) {
            console.error('Error finding all plants:', error);
            return [];
        }
    }

    static async create(plant: PlantType): Promise<boolean>
    {
        try {
            const result = await database.runAsync(
                'INSERT INTO plants (id, name, type, scientific_name, description, img, is_dead, area_id, todos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                plant.id,
                plant.name,
                plant.type,
                plant.scientificName || null,
                plant.description || null,
                plant.img || null,
                sqliteHelpers.boolToInt(plant.isDead),
                plant.areaId || null,
                JSON.stringify(plant.todos)
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error creating plant:', error);
            return false;
        }
    }

    static async update(plant: PlantType): Promise<boolean>
    {
        try {
            const result = await database.runAsync(
                'UPDATE plants SET name = ?, type = ?, scientific_name = ?, description = ?, img = ?, is_dead = ?, area_id = ?, todos = ? WHERE id = ?',
                plant.name,
                plant.type,
                plant.scientificName || null,
                plant.description || null,
                plant.img || null,
                sqliteHelpers.boolToInt(plant.isDead),
                plant.areaId || null,
                JSON.stringify(plant.todos),
                plant.id
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error updating plant:', error);
            return false;
        }
    }

    static async updates(plants: PlantType[]): Promise<boolean>
    {
        try {
            const result = await database.runAsync('UPDATE plants SET is_dead = ?, todos = ? WHERE id IN (' + plants.map(() => '?').join(',') + ')', ...plants.map(p => sqliteHelpers.boolToInt(p.isDead)), ...plants.map(p => JSON.stringify(p.todos)), ...plants.map(p => p.id));
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating plants:', error);
            return false;
        }
    }

    static async delete(id: string): Promise<boolean>
    {
        try {
            const result = await database.runAsync('DELETE FROM plants WHERE id = ?', id);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting plant:', error);
            return false;
        }
    }

    static async deletes(ids: string[]): Promise<boolean>
    {
        try {
            const result = await database.runAsync('DELETE FROM plants WHERE id IN (' + ids.map(() => '?').join(',') + ')', ...ids);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting plants:', error);
            return false;
        }
    }
}
