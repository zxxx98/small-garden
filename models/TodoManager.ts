import { ITodoModel } from '@/stores/PlantStore';
import { calculateNextRemindTime } from '@/utils/plant';
import { showMessage } from 'react-native-flash-message';
import { rootStore } from '@/stores/RootStore';

export class TodoManager {
    private static instance: TodoManager;

    private constructor() {}

    public static getInstance(): TodoManager {
        if (!TodoManager.instance) {
            TodoManager.instance = new TodoManager();
        }
        return TodoManager.instance;
    }

    // 检查并处理过期待办
    public checkExpiredTodos(todos: ITodoModel[]): void {
        const now = new Date().getTime();
        const expiredTodos: ITodoModel[] = [];
        const recurringTodos: ITodoModel[] = [];

        // 分类待办事项
        todos.forEach(todo => {
            if (todo.nextRemindTime < now) {
                if (todo.isRecurring) {
                    recurringTodos.push(todo);
                } else {
                    expiredTodos.push(todo);
                }
            }
        });

        // 处理过期待办
        if (expiredTodos.length > 0) {
            const message = expiredTodos.map(todo => 
                `${todo.plant.name}的${todo.actionName}已过期`
            ).join('\n');
            
            showMessage({
                message: '有待办事项已过期',
                description: message,
                type: 'warning',
                duration: 5000
            });
        }

        // 更新循环待办的下次提醒时间
        recurringTodos.forEach(todo => {
            const nextTime = calculateNextRemindTime(todo.recurringUnit, todo.recurringInterval);
            const plant = rootStore.plantStore.plants.find(p => p.id === todo.plantId);
            if (plant) {
                const todoIndex = plant.todos.findIndex(t => 
                    t.plantId === todo.plantId && 
                    t.actionName === todo.actionName
                );
                if (todoIndex !== -1) {
                    plant.updateTodo({
                        ...plant.todos[todoIndex],
                        nextRemindTime: nextTime
                    });
                }
            }
        });
    }
} 