# 小花园 (Small Garden) 🌱

小花园是一个帮助您管理植物和园艺活动的移动应用程序。无论您是经验丰富的园丁还是刚开始养护植物的新手，这款应用都能帮助您跟踪植物的生长情况和维护任务。

## 功能特点

- **植物管理**：添加、编辑和管理您的植物收藏
- **待办事项**：创建和跟踪植物护理任务，如浇水、施肥等
- **时间线**：查看您完成的所有植物护理活动的历史记录
- **墓地功能**：为不幸死亡的植物提供特殊标记
- **支持离线使用**：使用 SQLite 数据库在本地存储所有数据
- **深色/浅色主题**：根据您的喜好选择应用主题

## 技术栈

- [React Native](https://reactnative.dev/) - 跨平台移动应用开发框架
- [Expo](https://expo.dev/) - React Native 开发工具和服务
- [UI Kitten](https://akveo.github.io/react-native-ui-kitten/) - React Native UI 组件库
- [Expo Router](https://docs.expo.dev/router/introduction/) - 基于文件的路由系统
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) - 本地数据库存储

## 开始使用

### 前提条件

- [Node.js](https://nodejs.org/) (推荐 LTS 版本)
- [npm](https://www.npmjs.com/) 或 [pnpm](https://pnpm.io/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 安装

1. 克隆仓库

   ```bash
   git clone https://github.com/yourusername/small-garden.git
   cd small-garden
   ```

2. 安装依赖

   ```bash
   npm install
   # 或者使用 pnpm
   pnpm install
   ```

3. 启动应用

   ```bash
   npx expo start
   ```

   在输出中，您将找到在以下环境中打开应用的选项：
   - [开发构建](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android 模拟器](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS 模拟器](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)

## 项目结构

```
small-garden/
├── app/                  # 主应用代码
│   ├── (tabs)/           # 标签页面（植物、待办、时间线）
│   └── index.tsx         # 应用入口点
├── assets/               # 图像、字体和其他静态资源
├── components/           # 可重用组件
├── context/              # React 上下文提供者
├── models/               # 数据模型和管理器
│   ├── sqlite/           # SQLite 数据库实现
│   ├── ActionManager.ts  # 活动管理
│   └── PlantManager.ts   # 植物管理
├── theme/                # 主题配置
└── types/                # TypeScript 类型定义
```

## 构建应用

使用 EAS Build 构建应用：

```bash
eas build --platform android
# 或
eas build --platform ios
```

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可证

[MIT](LICENSE)
