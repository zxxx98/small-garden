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

## 已知问题 (Known Bugs)

- [ ] 创建待办的时候植物下拉列表需要点击两次
- [x] 进入植物页面UI闪烁问题
- [x] 已有的植物无法查看照片，只能编辑

## 待办事项 (Todo)

- [x] 实现数据储存到云端功能
- [x] 添加植物识别功能
- [ ] 增加多语言支持
- [ ] 添加推送通知功能

## 构建应用

使用 EAS Build 构建应用：

```bash
eas build --platform android
# 或
eas build --platform ios
```

## Cloudflare R2 配置教程

小花园应用支持使用 Cloudflare R2 作为图片存储服务，这样您可以在不同设备间同步您的植物图片。以下是配置 Cloudflare R2 的详细步骤：

### 1. 创建 Cloudflare 账户

如果您还没有 Cloudflare 账户，请先在 [Cloudflare 官网](https://www.cloudflare.com/) 注册一个账户。

### 2. 创建 R2 存储桶

1. 登录 Cloudflare 控制台
2. 在左侧菜单中点击 "R2"
3. 点击 "Create bucket" 按钮
4. 输入存储桶名称（例如：small-garden-images）
5. 选择存储桶所在地区（建议选择离您较近的地区）
6. 点击 "Create bucket" 完成创建

### 3. 创建 API 令牌

1. 在 Cloudflare 控制台左侧菜单中点击 "R2"
2. 点击 "Manage R2 API Tokens"
3. 点击 "Create API Token"
4. 输入令牌名称（例如：small-garden-app）
5. 选择权限：
   - 选择 "Edit" 权限以允许上传和删除文件
   - 选择 "Read" 权限以允许读取文件
6. 点击 "Create API Token" 完成创建
7. 保存生成的 Access Key ID 和 Secret Access Key（这些信息只会显示一次）

### 4. 配置公共访问

为了能够通过 URL 访问您上传的图片，您需要配置 R2 的公共访问：

1. 在 R2 页面中，点击 "Settings"
2. 在 "Public Access" 部分，启用公共访问
3. 配置自定义域名（可选）或使用 Cloudflare 提供的默认域名
4. 保存设置

### 5. 在应用中配置 R2

1. 打开小花园应用
2. 进入 "设置" 页面
3. 在 "云存储" 部分，启用 "使用 Cloudflare R2 存储"
4. 点击 "Cloudflare R2 配置"
5. 填写以下信息：
   - Account ID：您的 Cloudflare 账户 ID（可在 Cloudflare 控制台首页找到）
   - Access Key ID：您创建的 API 令牌的 Access Key ID
   - Secret Access Key：您创建的 API 令牌的 Secret Access Key
   - Bucket Name：您创建的 R2 存储桶名称
   - Public URL：您的 R2 公共访问 URL（例如：https://pub-xxxxx.r2.dev）
6. 点击 "保存配置"

### 6. 验证配置

配置完成后，您可以尝试上传一张植物图片来验证 R2 配置是否正常工作。如果图片能够成功上传并显示，则表示配置成功。

### 注意事项

- 请妥善保管您的 API 令牌信息，不要分享给他人
- Cloudflare R2 提供免费存储额度，超出后可能需要付费
- 如果您更改了 R2 配置，应用中的现有图片可能需要重新上传

## PlantNet API 密钥获取教程

小花园应用支持使用 PlantNet API 进行植物识别，帮助您快速识别未知植物。以下是获取 PlantNet API 密钥的详细步骤：

### 1. 注册 PlantNet 账户

1. 访问 [PlantNet 官网](https://my-api.plantnet.org/)
2. 点击页面右上角的 "Sign up" 按钮
3. 填写注册表单，包括：
   - 电子邮件地址
   - 密码
   - 用户名
4. 阅读并同意服务条款
5. 点击 "Create account" 完成注册

### 2. 登录 PlantNet 账户

1. 使用您注册的电子邮件和密码登录 PlantNet
2. 登录后，您将被引导至 PlantNet 控制台

### 3. 获取 API 密钥

1. 在 PlantNet 控制台中，点击 "My API Keys" 或 "API Keys" 选项
2. 点击 "Create a new API key" 按钮
3. 输入 API 密钥的描述（例如：small-garden-app）
4. 选择 API 密钥的权限级别（建议选择 "Standard" 级别）
5. 点击 "Create" 按钮
6. 系统将生成一个 API 密钥，请立即复制并保存（此密钥只会显示一次）

### 4. 在应用中配置 PlantNet API 密钥

1. 打开小花园应用
2. 进入 "设置" 页面
3. 在 "API 配置" 部分，点击 "PlantNet API Key"
4. 在弹出的对话框中输入您获取的 API 密钥
5. 点击 "保存" 按钮

### 5. 使用植物识别功能

配置完成后，您可以在添加或编辑植物时使用植物识别功能：

1. 在添加/编辑植物页面，点击 "识别植物" 按钮
2. 拍摄或选择一张植物照片
3. 应用将使用 PlantNet API 分析照片并返回可能的植物匹配结果
4. 从结果列表中选择正确的植物，或手动输入植物信息

### 注意事项

- PlantNet API 有使用限制，免费账户每天有请求次数限制
- 植物识别的准确性取决于照片质量和植物特征的可识别性
- 建议拍摄植物的叶子、花朵或果实等特征明显的部位
- 请妥善保管您的 API 密钥，不要分享给他人

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可证

[MIT](LICENSE)
