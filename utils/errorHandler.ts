import { rootStore } from '../stores/RootStore';

// 保存原始的console.error函数
const originalConsoleError = console.error;

// 重写console.error函数
console.error = function (...args: any[]) {
    // 调用原始的console.error
    originalConsoleError.apply(console, args);

    // 将错误添加到日志中
    const errorMessage = args.map(arg => {
        if (arg instanceof Error) {
            return arg.message;
        }
        return String(arg);
    }).join(' ');

    // 获取错误堆栈（如果有的话）
    const errorDetails = args.find(arg => arg instanceof Error)?.stack;

    // 添加到日志存储
    rootStore.logStore.addLog('error', errorMessage, {
        stack: errorDetails,
        timestamp: new Date().toISOString()
    });
}; 