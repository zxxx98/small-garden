import * as FileSystem from 'expo-file-system';
import { ConfigManager } from './ConfigManager';
import { R2Config } from '../types/config';
import { CloudflareR2Manager } from './CloudflareR2Manager';
import { generateId } from '@/utils/uuid';

export class FileManager
{
    private static instance: FileManager;
    private readonly imageDir: string;
    private useR2Storage: boolean = false;
    private r2Config: R2Config | null = null;

    private constructor()
    {
        // 在不同平台使用适当的目录
        this.imageDir = `${FileSystem.documentDirectory}images/`;

        // 初始化时加载配置
        this.loadConfig();
    }

    private async loadConfig()
    {
        try {
            const configManager = ConfigManager.getInstance();
            this.useR2Storage = await configManager.getUseR2Storage();
            this.r2Config = await configManager.getR2Config();
        } catch (error) {
            console.error('Failed to load storage config:', error);
            this.useR2Storage = false;
            this.r2Config = null;
        }
    }

    public static getInstance(): FileManager
    {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    /**
     * 更新存储配置
     */
    public async updateStorageConfig()
    {
        await this.loadConfig();
    }

    /**
     * 确保图片目录存在
     */
    private async ensureImageDirExists(): Promise<void>
    {
        const dirInfo = await FileSystem.getInfoAsync(this.imageDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(this.imageDir, { intermediates: true });
        }
    }

    /**
     * 生成唯一的文件名
     */
    private generateUniqueFileName(extension: string = '.jpg'): string
    {
        return `${generateId()}${extension}`;
    }

    /**
     * 保存图片到本地文件系统或R2
     * @param imageSource base64数据或者图片uri
     * @returns 保存后的文件路径或URL
     */
    public async saveImage(imageSource: string): Promise<string>
    {
        // 刷新配置确保使用最新设置
        await this.loadConfig();

        // 如果使用R2且配置有效，保存到R2
        if (this.useR2Storage && this.r2Config && this.isValidR2Config(this.r2Config)) {
            return this.saveImageToR2(imageSource);
        }

        // 否则保存到本地
        return this.saveImageToLocal(imageSource);
    }

    /**
     * 检查R2配置是否有效
     */
    private isValidR2Config(config: R2Config): boolean
    {
        return !!(
            config.accountId &&
            config.accessKeyId &&
            config.secretAccessKey &&
            config.bucketName
        );
    }

    /**
     * 保存图片到本地
     */
    private async saveImageToLocal(imageSource: string): Promise<string>
    {
        await this.ensureImageDirExists();

        const fileName = this.generateUniqueFileName();
        const filePath = `${this.imageDir}${fileName}`;

        if (imageSource.startsWith('data:image')) {
            // 处理base64图片数据
            await FileSystem.writeAsStringAsync(filePath, imageSource.split(',')[1], {
                encoding: FileSystem.EncodingType.Base64,
            });
        } else {
            // 处理图片URI
            await FileSystem.copyAsync({
                from: imageSource,
                to: filePath
            });
        }

        return filePath;
    }

    /**
     * 保存图片到R2
     * 注意: 这是一个模拟实现，需要依赖实际的R2 SDK
     */
    private async saveImageToR2(imageSource: string): Promise<string>
    {
        if (!this.r2Config) {
            throw new Error('R2 config is not available');
        }
        try {
            const extension = imageSource.split('.').pop() || 'jpg';
            const fileName = this.generateUniqueFileName(extension);
            // R2上传逻辑将在此实现
            // 注意: 实际项目需要添加依赖库如 aws-sdk 来实现
            const r2Manager = CloudflareR2Manager.getInstance(this.r2Config.accountId, this.r2Config.accessKeyId, this.r2Config.secretAccessKey, this.r2Config.bucketName);
            await r2Manager.uploadFile(fileName, imageSource);
            //替换url为r2Config中的publicUrl
            const url = `${this.r2Config.publicUrl}/${fileName}`;
            console.log(url);
            return url;
        } catch (error) {
            console.error('Failed to upload to R2:', error);
            // 如果R2上传失败，返回本地路径作为备份
            return imageSource;
        }
    }

    /**
     * 获取图片URI，处理本地或R2路径
     */
    public async getImageUri(filePath: string): Promise<string>
    {
        // 如果是R2 URL，直接返回
        if (filePath.startsWith('http')) {
            return filePath;
        }

        // 否则处理本地文件
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
            throw new Error('Image file not found');
        }
        return fileInfo.uri;
    }

    /**
     * 删除图片，处理本地或R2路径
     */
    public async deleteImage(filePath: string): Promise<void>
    {
        // 刷新配置
        await this.loadConfig();

        // 如果是R2 URL
        if (filePath.startsWith('http')) {
            if (this.useR2Storage && this.r2Config && this.isValidR2Config(this.r2Config)) {
                await this.deleteImageFromR2(filePath);
            }
            return;
        }

        // 处理本地文件
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
        }
    }

    /**
     * 从R2删除图片
     * 注意: 这是一个模拟实现，需要依赖实际的R2 SDK
     */
    private async deleteImageFromR2(url: string): Promise<void>
    {
        if (!this.r2Config) {
            throw new Error('R2 config is not available');
        }

        try {
            // 从URL提取文件名
            const fileName = url.split('/').pop();
            if (!fileName) {
                throw new Error('Cannot extract filename from URL');
            }

            // R2删除逻辑将在此实现
            // 注意: 实际项目需要添加依赖库如 aws-sdk 来实现

            console.log(`Deleted ${fileName} from R2 (simulation)`);
        } catch (error) {
            console.error('Failed to delete from R2:', error);
            throw new Error('Failed to delete image from R2');
        }
    }

    /**
     * 批量删除图片
     * @param filePaths 图片文件路径数组
     */
    public async deleteImages(filePaths: string[]): Promise<void>
    {
        await Promise.all(filePaths.map(path => this.deleteImage(path)));
    }
}

export const fileManager = FileManager.getInstance();