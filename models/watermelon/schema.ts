import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
    version: 2,
    tables: [
        tableSchema({
            name: 'plants',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'type', type: 'string' },
                { name: 'scientific_name', type: 'string', isOptional: true },
                { name: 'remark', type: 'string', isOptional: true },
                { name: 'img', type: 'string', isOptional: true },
                { name: 'is_dead', type: 'boolean' }
            ]
        }),
        tableSchema({
            name: 'actions',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'plant_id', type: 'string', isIndexed: true },
                { name: 'time', type: 'number' },
                { name: 'remark', type: 'string', isOptional: true },
                { name: 'imgs', type: 'string', isOptional: true },
                { name: 'done', type: 'boolean' }
            ]
        })
    ]
});