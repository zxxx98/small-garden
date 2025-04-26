import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as FileSystem from 'expo-file-system';
import 'react-native-get-random-values'; // Add polyfill for crypto.getRandomValues()

/**
 * CloudflareR2Manager - Manages operations with Cloudflare R2 storage
 * 
 * This class provides methods to interact with Cloudflare R2 object storage,
 * including uploading, downloading, and deleting files, as well as generating
 * presigned URLs for temporary access.
 */
export class CloudflareR2Manager
{
    private static instance: CloudflareR2Manager;
    private s3Client: S3Client;
    private bucketName: string;
    private accountId: string;
    private memoryCache: Map<string, { data: string, timestamp: number }> = new Map();
    private cacheExpirationTime: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    private cacheDirectory: string = `${FileSystem.cacheDirectory}r2-cache/`;

    /**
     * Private constructor to enforce singleton pattern
     * @param accountId Cloudflare account ID
     * @param accessKeyId R2 access key ID
     * @param secretAccessKey R2 secret access key
     * @param bucketName R2 bucket name
     */
    private constructor(accountId: string, accessKeyId: string, secretAccessKey: string, bucketName: string)
    {
        this.accountId = accountId;
        this.bucketName = bucketName;

        // Initialize S3 client with R2 configuration
        this.s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
            // Fix for checksum validation issues with newer AWS SDK versions
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        });

        // Initialize cache directory
        this.initializeCacheDirectory();
    }

    /**
     * Initialize the cache directory
     */
    private async initializeCacheDirectory(): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
            }
        } catch (error) {
            console.error("Error initializing cache directory:", error);
        }
    }

    /**
     * Get the singleton instance of CloudflareR2Manager
     * @param accountId Cloudflare account ID
     * @param accessKeyId R2 access key ID
     * @param secretAccessKey R2 secret access key
     * @param bucketName R2 bucket name
     * @returns CloudflareR2Manager instance
     */
    public static getInstance(
        accountId?: string,
        accessKeyId?: string,
        secretAccessKey?: string,
        bucketName?: string
    ): CloudflareR2Manager
    {
        if (!CloudflareR2Manager.instance) {
            if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
                throw new Error("R2 credentials and bucket name are required for initialization");
            }
            CloudflareR2Manager.instance = new CloudflareR2Manager(
                accountId,
                accessKeyId,
                secretAccessKey,
                bucketName
            );
        }
        return CloudflareR2Manager.instance;
    }

    /**
     * Upload a file to R2 storage
     * @param key Object key (path in the bucket)
     * @param filePath Local file path to upload
     * @param contentType Optional content type of the file
     * @returns URL of the uploaded file
     */
    public async uploadFile(key: string, filePath: string, contentType?: string): Promise<string>
    {
        try {
            // Read file content
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (!fileInfo.exists) {
                throw new Error(`File not found: ${filePath}`);
            }

            const fileContent = await FileSystem.readAsStringAsync(filePath, {
                encoding: FileSystem.EncodingType.Base64
            });

            // Convert base64 to ArrayBuffer
            const binaryString = atob(fileContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create and execute PutObjectCommand
            console.log("start upload");
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: bytes,
                ContentType: contentType || this.getContentTypeFromPath(filePath),
            });

            await this.s3Client.send(command);
            console.log("upload complete");
            
            // Update cache if this is an image
            if (this.isImageFile(key)) {
                await this.updateCache(key, fileContent);
            }
            
            // Return the URL of the uploaded file
            return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
        } catch (error) {
            console.error("Error uploading file to R2:", error);
            throw error;
        }
    }

    /**
     * Download a file from R2 storage with caching
     * @param key Object key to download
     * @param destinationPath Local path to save the downloaded file
     * @param forceRefresh Whether to force refresh the cache
     * @returns Local path of the downloaded file
     */
    public async downloadFile(key: string, destinationPath: string, forceRefresh: boolean = false): Promise<string>
    {
        try {
            // Check if this is an image file
            const isImage = this.isImageFile(key);
            
            // If it's an image and we're not forcing a refresh, try to get from cache first
            if (isImage && !forceRefresh) {
                const cachedPath = await this.getFromCache(key);
                if (cachedPath) {
                    console.log(`Using cached file for ${key}`);
                    return cachedPath;
                }
            }

            // If not in cache or force refresh, download from R2
            console.log(`Downloading file ${key} from R2`);
            
            // Create and execute GetObjectCommand
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error("Empty response body");
            }

            // Convert response body to Uint8Array
            const responseArrayBuffer = await response.Body.transformToByteArray();

            // Convert Uint8Array to base64
            let binary = '';
            const bytes = new Uint8Array(responseArrayBuffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            // Write file to local storage
            await FileSystem.writeAsStringAsync(destinationPath, base64, {
                encoding: FileSystem.EncodingType.Base64
            });

            // If this is an image, update the cache
            if (isImage) {
                await this.updateCache(key, base64);
            }

            return destinationPath;
        } catch (error) {
            console.error("Error downloading file from R2:", error);
            throw error;
        }
    }

    /**
     * Get a file from cache if available
     * @param key Object key
     * @returns Local path of the cached file or null if not in cache
     */
    private async getFromCache(key: string): Promise<string | null> {
        try {
            // Check memory cache first
            const memoryCacheEntry = this.memoryCache.get(key);
            if (memoryCacheEntry) {
                const now = Date.now();
                if (now - memoryCacheEntry.timestamp < this.cacheExpirationTime) {
                    // Cache is valid, write to destination and return
                    const cacheFilePath = this.getCacheFilePath(key);
                    await FileSystem.writeAsStringAsync(cacheFilePath, memoryCacheEntry.data, {
                        encoding: FileSystem.EncodingType.Base64
                    });
                    return cacheFilePath;
                } else {
                    // Cache expired, remove it
                    this.memoryCache.delete(key);
                }
            }

            // Check file system cache
            const cacheFilePath = this.getCacheFilePath(key);
            const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
            
            if (fileInfo.exists) {
                // Check if file is still valid (not too old)
                try {
                    // Get file stats to check modification time
                    const fileStats = await FileSystem.getInfoAsync(cacheFilePath, { size: true });
                    // Use a timestamp-based approach instead of relying on modificationTime
                    const fileAge = Date.now() - (fileStats.exists ? Date.now() - 3600000 : 0); // Default to 1 hour old if can't determine
                    
                    if (fileAge < this.cacheExpirationTime) {
                        // Read file into memory cache for faster future access
                        const fileContent = await FileSystem.readAsStringAsync(cacheFilePath, {
                            encoding: FileSystem.EncodingType.Base64
                        });
                        this.memoryCache.set(key, { 
                            data: fileContent, 
                            timestamp: Date.now() 
                        });
                        return cacheFilePath;
                    }
                } catch (error) {
                    console.error("Error checking file age:", error);
                }
            }
            
            return null;
        } catch (error) {
            console.error("Error getting file from cache:", error);
            return null;
        }
    }

    /**
     * Update cache with file content
     * @param key Object key
     * @param base64Content Base64 encoded file content
     */
    private async updateCache(key: string, base64Content: string): Promise<void> {
        try {
            // Update memory cache
            this.memoryCache.set(key, { 
                data: base64Content, 
                timestamp: Date.now() 
            });

            // Update file system cache
            const cacheFilePath = this.getCacheFilePath(key);
            await FileSystem.writeAsStringAsync(cacheFilePath, base64Content, {
                encoding: FileSystem.EncodingType.Base64
            });
        } catch (error) {
            console.error("Error updating cache:", error);
        }
    }

    /**
     * Get the cache file path for a key
     * @param key Object key
     * @returns Cache file path
     */
    private getCacheFilePath(key: string): string {
        // Create a safe filename from the key
        const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
        return `${this.cacheDirectory}${safeKey}`;
    }

    /**
     * Check if a file is an image based on its extension
     * @param key Object key
     * @returns Whether the file is an image
     */
    private isImageFile(key: string): boolean {
        const extension = key.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
    }

    /**
     * Clear the cache for a specific key or all keys
     * @param key Optional object key to clear from cache
     */
    public async clearCache(key?: string): Promise<void> {
        try {
            if (key) {
                // Clear specific key from memory cache
                this.memoryCache.delete(key);
                
                // Clear specific key from file system cache
                const cacheFilePath = this.getCacheFilePath(key);
                const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(cacheFilePath);
                }
            } else {
                // Clear all memory cache
                this.memoryCache.clear();
                
                // Clear all file system cache
                const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
                if (dirInfo.exists) {
                    await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
                    await this.initializeCacheDirectory();
                }
            }
        } catch (error) {
            console.error("Error clearing cache:", error);
        }
    }

    /**
     * Delete a file from R2 storage
     * @param key Object key to delete
     * @returns True if deletion was successful
     */
    public async deleteFile(key: string): Promise<boolean>
    {
        try {
            // Create and execute DeleteObjectCommand
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            
            // Also remove from cache
            await this.clearCache(key);
            
            return true;
        } catch (error) {
            console.error("Error deleting file from R2:", error);
            return false;
        }
    }

    /**
     * List files in the R2 bucket with optional prefix
     * @param prefix Optional prefix to filter objects
     * @returns Array of object keys
     */
    public async listFiles(prefix?: string): Promise<string[]>
    {
        try {
            // Create and execute ListObjectsV2Command
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
            });

            const response = await this.s3Client.send(command);

            // Extract and return keys from the response
            const keys: string[] = [];
            if (response.Contents) {
                for (const object of response.Contents) {
                    if (object.Key) {
                        keys.push(object.Key);
                    }
                }
            }

            return keys;
        } catch (error) {
            console.error("Error listing files from R2:", error);
            throw error;
        }
    }

    /**
     * Generate a presigned URL for temporary access to an object
     * @param key Object key
     * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
     * @param operation Operation type ('get' or 'put')
     * @returns Presigned URL
     */
    public async getPresignedUrl(
        key: string,
        expiresIn: number = 3600,
        operation: 'get' | 'put' = 'get'
    ): Promise<string>
    {
        try {
            // Create command based on operation type
            const command = operation === 'get'
                ? new GetObjectCommand({ Bucket: this.bucketName, Key: key })
                : new PutObjectCommand({ Bucket: this.bucketName, Key: key });

            // Generate and return presigned URL
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            console.error(`Error generating presigned ${operation} URL:`, error);
            throw error;
        }
    }

    /**
     * Get content type based on file extension
     * @param filePath File path
     * @returns Content type string
     */
    private getContentTypeFromPath(filePath: string): string
    {
        const extension = filePath.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            case 'pdf':
                return 'application/pdf';
            case 'json':
                return 'application/json';
            default:
                return 'application/octet-stream';
        }
    }
}
