import * as FileSystem from 'expo-file-system';

export class FileManager {
    private static instance: FileManager;
    private readonly imageDir: string;

    private constructor() {
        // 在不同平台使用适当的目录
        this.imageDir = `${FileSystem.documentDirectory}images/`;
    }

    public static getInstance(): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    /**
     * 确保图片目录存在
     */
    private async ensureImageDirExists(): Promise<void> {
        const dirInfo = await FileSystem.getInfoAsync(this.imageDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(this.imageDir, { intermediates: true });
        }
    }

    /**
     * 生成唯一的文件名
     */
    private generateUniqueFileName(extension: string = '.jpg'): string {
        return `${Date.now()}_${Math.random().toString(36).substring(2)}${extension}`;
    }

    /**
     * 保存图片到本地文件系统
     * @param imageSource base64数据或者图片uri
     * @returns 保存后的本地文件路径
     */
    public async saveImage(imageSource: string): Promise<string> {
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
     * 获取本地图片URI
     * @param filePath 图片文件路径
     * @returns 图片URI
     */
    public async getImageUri(filePath: string): Promise<string> {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
            throw new Error('Image file not found');
        }
        return fileInfo.uri;
    }

    /**
     * 删除本地图片
     * @param filePath 图片文件路径
     */
    public async deleteImage(filePath: string): Promise<void> {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
        }
    }

    /**
     * 批量删除图片
     * @param filePaths 图片文件路径数组
     */
    public async deleteImages(filePaths: string[]): Promise<void> {
        await Promise.all(filePaths.map(path => this.deleteImage(path)));
    }
}

export const fileManager = FileManager.getInstance();