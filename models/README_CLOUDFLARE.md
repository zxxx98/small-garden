# Cloudflare R2 和 D1 集成（重要提示：由于D1需要Worker桥接，暂时项目中不使用）

本文档说明如何在 Small Garden 应用程序中使用 Cloudflare R2 存储和 D1 数据库集成。

## 概述

该集成包含两个主要类：

1. `CloudflareR2Manager` - 用于与 Cloudflare R2 对象存储交互
2. `CloudflareD1Manager` - 用于与 Cloudflare D1 SQL 数据库交互

这些类提供了一个简单的接口来执行 Cloudflare 服务的常见操作。

## 前提条件

在使用这些类之前，您需要：

1. 创建 Cloudflare 账户
2. 在您的 Cloudflare 账户中设置 R2 存储桶
3. 在您的 Cloudflare 账户中创建 D1 数据库
4. 将 D1 API Worker 部署到 Cloudflare Workers
5. 生成具有适当权限的 API 令牌

## CloudflareR2Manager

### 初始化

```typescript
import { CloudflareR2Manager } from './models/CloudflareR2Manager';

const r2Manager = CloudflareR2Manager.getInstance(
    'YOUR_CLOUDFLARE_ACCOUNT_ID',
    'YOUR_R2_ACCESS_KEY_ID',
    'YOUR_R2_SECRET_ACCESS_KEY',
    'YOUR_R2_BUCKET_NAME'
);
```

### 主要方法

#### 上传文件

```typescript
// 将本地文件上传到 R2
const uploadedUrl = await r2Manager.uploadFile(
    'path/in/bucket/filename.jpg',  // R2 键（存储桶中的路径）
    '/local/path/to/file.jpg',      // 本地文件路径
    'image/jpeg'                    // 可选的内容类型
);
```

#### 下载文件

```typescript
// 从 R2 下载文件到本地存储
const localPath = await r2Manager.downloadFile(
    'path/in/bucket/filename.jpg',  // 要下载的 R2 键
    '/local/path/to/save/file.jpg'  // 保存文件的本地路径
);
```

#### 删除文件

```typescript
// 从 R2 删除文件
const success = await r2Manager.deleteFile('path/in/bucket/filename.jpg');
```

#### 列出文件

```typescript
// 列出 R2 存储桶中的文件（可选前缀）
const files = await r2Manager.listFiles('uploads/');
```

#### 生成预签名 URL

```typescript
// 生成用于临时访问的预签名 URL
const url = await r2Manager.getPresignedUrl(
    'path/in/bucket/filename.jpg',  // R2 键
    3600,                           // 过期时间（秒）（1小时）
    'get'                           // 操作类型（'get' 或 'put'）
);
```

## CloudflareD1Manager

### 初始化

```typescript
import { CloudflareD1Manager } from './models/CloudflareD1Manager';

const d1Manager = CloudflareD1Manager.getInstance(
    'https://your-d1-api-worker.your-domain.com',  // 您部署的 Worker URL
    'YOUR_SECURE_API_KEY'                          // Worker 中配置的 API 密钥
);
```

### 主要方法

#### 执行查询

```typescript
// 执行带参数的 SQL 查询
const result = await d1Manager.executeQuery(
    'SELECT * FROM plants WHERE type = ? AND is_dead = ?',
    ['Indoor', 0]
);
```

#### 获取单行数据

```typescript
// 从查询结果获取第一行
const plant = await d1Manager.getFirst(
    'SELECT * FROM plants WHERE id = ?',
    ['plant-123']
);
```

#### 获取所有行

```typescript
// 获取查询结果的所有行
const plants = await d1Manager.getAll(
    'SELECT * FROM plants WHERE type = ?',
    ['Indoor']
);
```

#### 插入数据

```typescript
// 向表中插入一行
const insertResult = await d1Manager.insert('plants', {
    id: 'plant-123',
    name: 'My Plant',
    type: 'Indoor',
    scientific_name: 'Plantus Indoorus',
    remark: 'My favorite plant',
    img: 'https://example.com/plant.jpg',
    is_dead: 0
});
```

#### 更新数据

```typescript
// 更新表中的行
const updateResult = await d1Manager.update(
    'plants',                       // 表名
    { name: 'New Plant Name' },     // 要更新的数据
    'id = ?',                       // WHERE 子句
    ['plant-123']                   // WHERE 参数
);
```

#### 删除数据

```typescript
// 从表中删除行
const deleteResult = await d1Manager.delete(
    'plants',                       // 表名
    'id = ?',                       // WHERE 子句
    ['plant-123']                   // WHERE 参数
);
```

#### 执行批量操作

```typescript
// 在批处理中执行多个查询
const batchResult = await d1Manager.executeBatch([
    {
        sql: 'INSERT INTO plants (id, name, type, is_dead) VALUES (?, ?, ?, ?)',
        params: ['plant-1', 'Plant 1', 'Indoor', 0]
    },
    {
        sql: 'INSERT INTO plants (id, name, type, is_dead) VALUES (?, ?, ?, ?)',
        params: ['plant-2', 'Plant 2', 'Outdoor', 0]
    }
]);
```

#### 创建表

```typescript
// 在数据库中创建表
await d1Manager.createTable('plants', `
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    scientific_name TEXT,
    remark TEXT,
    img TEXT,
    is_dead INTEGER NOT NULL
`);
```

#### 删除表

```typescript
// 从数据库中删除表
await d1Manager.dropTable('plants');
```

## 与现有代码集成

要与现有的 `FileManager` 和数据库操作集成：

1. 使用 `CloudflareR2Manager` 进行远程图片存储
2. 使用 `CloudflareD1Manager` 将本地 SQLite 数据同步到云端

上传本地图片到 R2 的示例：

```typescript
import { fileManager } from './models/FileManager';
import { CloudflareR2Manager } from './models/CloudflareR2Manager';

// 首先保存图片到本地
const localPath = await fileManager.saveImage(imageUri);

// 然后上传到 R2
const r2Manager = CloudflareR2Manager.getInstance(/* 凭证 */);
const r2Key = `plants/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
const cloudUrl = await r2Manager.uploadFile(r2Key, localPath);

// 现在您可以将 cloudUrl 存储在数据库中
```

## 部署 D1 API Worker

由于 Cloudflare D1 不提供直接的 REST API 供外部访问，我们需要部署一个 Worker 作为应用程序和 D1 数据库之间的代理。

1. 导航到 `worker` 目录
2. 使用您的 D1 数据库信息更新 `wrangler.toml` 文件
3. 使用您允许的源和 API 密钥更新 `d1-api-worker.js` 文件
4. 使用 Wrangler 部署 Worker：

```bash
npx wrangler deploy
```

5. 记下您部署的 Worker URL（例如 `https://d1-api-worker.your-domain.com`）
6. 初始化 `CloudflareD1Manager` 时使用此 URL

## 安全注意事项

- 切勿在应用程序代码中硬编码您的 Cloudflare 凭证
- 安全地存储凭证，最好在环境变量或安全存储解决方案中
- 考虑为生产应用程序实现令牌轮换
- 为您的 API 令牌使用最小所需权限
- 使用强 API 密钥和适当的 CORS 配置保护您的 Worker
- 考虑在 Worker 上实现速率限制以防止滥用

## 错误处理

两个类都包含全面的错误处理。始终将调用包装在 try/catch 块中：

```typescript
try {
    const result = await r2Manager.uploadFile(key, localPath);
    // 处理成功
} catch (error) {
    console.error("上传文件时出错:", error);
    // 适当处理错误
}
``` 