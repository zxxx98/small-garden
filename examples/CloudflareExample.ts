import { CloudflareR2Manager } from '../models/CloudflareR2Manager';
import { CloudflareD1Manager } from '../models/CloudflareD1Manager';
import * as FileSystem from 'expo-file-system';

/**
 * Example usage of CloudflareR2Manager and CloudflareD1Manager
 */
export async function cloudflareExample() {
    try {
        // Initialize R2 Manager
        const r2Manager = CloudflareR2Manager.getInstance(
            'YOUR_CLOUDFLARE_ACCOUNT_ID',
            'YOUR_R2_ACCESS_KEY_ID',
            'YOUR_R2_SECRET_ACCESS_KEY',
            'YOUR_R2_BUCKET_NAME'
        );

        // Initialize D1 Manager
        const d1Manager = CloudflareD1Manager.getInstance(
            'https://your-d1-api-worker.your-domain.com',
            'YOUR_SECURE_API_KEY'
        );

        // Example: Upload a file to R2
        const localImagePath = `${FileSystem.documentDirectory}images/example.jpg`;
        const r2Key = `uploads/${Date.now()}_example.jpg`;

        const uploadedUrl = await r2Manager.uploadFile(r2Key, localImagePath);
        console.log('File uploaded to R2:', uploadedUrl);

        // Example: Generate a presigned URL for the uploaded file
        const presignedUrl = await r2Manager.getPresignedUrl(r2Key, 3600);
        console.log('Presigned URL (valid for 1 hour):', presignedUrl);

        // Example: Create a table in D1
        await d1Manager.createTable('plants', `
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            scientific_name TEXT,
            remark TEXT,
            img TEXT,
            is_dead INTEGER NOT NULL
        `);
        console.log('Table created in D1');

        // Example: Insert data into D1
        const plantData = {
            id: 'plant-' + Date.now(),
            name: 'Example Plant',
            type: 'Indoor',
            scientific_name: 'Exampleus Plantus',
            remark: 'This is an example plant',
            img: uploadedUrl,
            is_dead: 0
        };

        const insertResult = await d1Manager.insert('plants', plantData);
        console.log('Plant inserted into D1:', insertResult);

        // Example: Query data from D1
        const plants = await d1Manager.getAll('SELECT * FROM plants WHERE type = ?', ['Indoor']);
        console.log('Indoor plants:', plants);

        // Example: Update data in D1
        const updateResult = await d1Manager.update(
            'plants',
            { name: 'Updated Plant Name' },
            'id = ?',
            [plantData.id]
        );
        console.log('Plant updated in D1:', updateResult);

        // Example: Execute a batch of queries
        const batchResult = await d1Manager.executeBatch([
            {
                sql: 'INSERT INTO plants (id, name, type, is_dead) VALUES (?, ?, ?, ?)',
                params: ['plant-batch-1', 'Batch Plant 1', 'Outdoor', 0]
            },
            {
                sql: 'INSERT INTO plants (id, name, type, is_dead) VALUES (?, ?, ?, ?)',
                params: ['plant-batch-2', 'Batch Plant 2', 'Outdoor', 0]
            }
        ]);
        console.log('Batch operation completed:', batchResult);

        // Example: Download a file from R2
        const downloadPath = `${FileSystem.documentDirectory}downloads/example.jpg`;
        const downloadedPath = await r2Manager.downloadFile(r2Key, downloadPath);
        console.log('File downloaded from R2:', downloadedPath);

        // Example: List files in R2
        const files = await r2Manager.listFiles('uploads/');
        console.log('Files in R2 uploads folder:', files);

        // Example: Delete a file from R2
        const deleteResult = await r2Manager.deleteFile(r2Key);
        console.log('File deleted from R2:', deleteResult);

        // Example: Delete data from D1
        const deleteDbResult = await d1Manager.delete('plants', 'id = ?', [plantData.id]);
        console.log('Plant deleted from D1:', deleteDbResult);

    } catch (error) {
        console.error('Error in Cloudflare example:', error);
    }
}
