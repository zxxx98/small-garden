import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ITodoModel } from '@/stores/PlantStore';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { ConfigManager } from './ConfigManager';

export class NotificationManager {
    private static instance: NotificationManager;

    private constructor() {
        this.configureNotifications();
    }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private async configureNotifications() {
        // 配置通知的显示方式
        await Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        // 请求通知权限
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
    }

    // 请求通知权限
    public async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        return finalStatus === 'granted';
    }

    // 发送待办事项通知
    public async scheduleTodoNotification(todo: ITodoModel) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.log('没有通知权限');
            return;
        }

        // 取消之前的通知（如果有）
        await this.cancelTodoNotification(todo.plantId + todo.actionName);

        // 获取自定义提醒时间
        const configManager = ConfigManager.getInstance();
        const hour = await configManager.getReminderHour();
        const minute = await configManager.getReminderMinute();

        // 创建新的通知
        const trigger = new Date(todo.nextRemindTime);
        trigger.setHours(hour, minute, 0); // 使用自定义时间

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '待办提醒',
                body: `${todo.plant.name}需要${todo.actionName}了`,
                data: { todoId: todo.plantId + todo.actionName },
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: trigger,
            },
        });
    }

    // 取消待办事项通知
    public async cancelTodoNotification(todoId: string) {
        await Notifications.cancelScheduledNotificationAsync(todoId);
    }

    // 发送即时通知（用于测试）
    public async sendImmediateNotification(title: string, body: string) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.log('没有通知权限');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
            },
            trigger: null, // 立即发送
        });
    }
} 