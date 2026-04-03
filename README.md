# CodeForge

基于模板的本地代码生成器，支持 MySQL 元数据读取、DDL 解析、自定义模板、类型映射和批量生成。

## 功能特性

- 数据源管理（MySQL，支持多连接配置）
- DDL 解析（无需连接数据库）
- 自定义模板引擎（基于 Nunjucks）
- 在线代码编辑器（Monaco Editor）
- 类型映射配置（MySQL → Java/TypeScript）
- 生成预览包 + 手动下载 ZIP
- 国际化支持（中文/英文）

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5
- Zustand（状态管理）
- React Router 6
- Monaco Editor
- i18next（国际化）
- Vite 5

### 后端
- NestJS 10 + TypeScript
- SQLite（sql.js）
- Nunjucks（模板引擎）
- MySQL2（数据源连接）
- node-sql-parser（DDL 解析）
- Archiver（ZIP 打包）

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Make (可选，用于快捷命令)

### 方式一：使用 Makefile（推荐）

查看所有可用命令：
```bash
make help
```

快速启动（自动安装依赖并启动服务）：
```bash
make quick
```

常用命令：
```bash
make install        # 安装所有依赖
make dev           # 同时启动前后端服务
make dev-server    # 仅启动后端
make dev-web       # 仅启动前端
make build         # 构建项目
make test          # 运行测试
make lint          # 代码检查
make format        # 代码格式化
make clean         # 清理构建文件
make stop          # 停止所有服务
make db-reset      # 重置数据库
make templates-reset # 仅重置内置模板（保留业务数据）
make doctor        # 检查开发环境
make templates     # 查看所有内置模板
```

### 方式二：使用 pnpm 命令

安装依赖：
```bash
pnpm install
```

启动开发环境：
```bash
# 同时启动前后端（推荐）
pnpm dev

# 或分别启动
pnpm dev:server  # 后端: http://localhost:3000
pnpm dev:web     # 前端: http://localhost:5173

# 或使用完整命令
pnpm --filter server dev
pnpm --filter web dev
```

### 生产构建（当前实现）

```bash
pnpm build
cd packages/server
node dist/main.js  # 访问 http://localhost:3000/api
```

说明：当前默认是前后端分离运行（开发期由 Vite 提供前端）。单进程托管前端静态资源可作为后续增强项。

## 项目结构

```
code-forge/
├── packages/
│   ├── server/          # NestJS 后端
│   │   ├── src/
│   │   │   ├── modules/ # 业务模块
│   │   │   └── database/# 数据库初始化
│   │   └── templates/   # 内置模板
│   └── web/             # React 前端
│       └── src/
│           ├── pages/   # 页面组件
│           ├── api/     # API 调用
│           ├── stores/  # 状态管理
│           └── locales/ # 国际化
└── data/                # SQLite 数据文件
```

## 使用指南

### 1. 配置数据源

在"数据源管理"页面添加 MySQL 数据源，测试连接。

### 2. 选择表和模板

在"代码生成"页面：
- 选择数据源或粘贴 DDL（支持多张表）
- 选择模板组
- 勾选要生成的表
- 配置包名、模块名等

### 3. 生成代码

先点击“生成预览包”确认内容，再点击“下载 ZIP”获取完整代码包。

### 4. 自定义模板

在"模板管理"页面：
- 复制内置模板组
- 使用 Monaco Editor 在线编辑
- 支持 Nunjucks 语法和自定义过滤器

## API（当前实现）

统一响应结构：

```json
{ "code": 0, "message": "success", "data": {} }
```

已实现接口（摘要）：

- 数据源
  - `GET /api/datasource`
  - `POST /api/datasource`
  - `PUT /api/datasource/:id`
  - `DELETE /api/datasource/:id`
  - `POST /api/datasource/test/:id`
  - `GET /api/datasource/:id/tables`
  - `GET /api/datasource/:id/tables/:tableName`
  - `POST /api/datasource/parse-ddl`
- 模板
  - `GET /api/template/groups`
  - `GET /api/template/groups/:id`
  - `GET /api/template/groups/:id/files`
  - `POST /api/template/groups`
  - `PUT /api/template/groups/:id`
  - `DELETE /api/template/groups/:id`
  - `POST /api/template/groups/:id/clone`
  - `POST /api/template/builtins/reset`
  - `GET /api/template/files/:id`
  - `POST /api/template/files`
  - `PUT /api/template/files/:id`
  - `DELETE /api/template/files/:id`
  - `PUT /api/template/files/order`
- 生成器
  - `POST /api/generator/preview`
  - `POST /api/generator/generate`
- 类型映射
  - `GET /api/type-mapping`
  - `GET /api/type-mapping/:id`
  - `POST /api/type-mapping`
  - `PUT /api/type-mapping/:id`
  - `DELETE /api/type-mapping/:id`
  - `POST /api/type-mapping/reset`
- 配置
  - `GET /api/config`
  - `PUT /api/config`
- 历史
  - `GET /api/history`
  - `DELETE /api/history/:id`
  - `DELETE /api/history`

生成请求示例（关键字段）：

```json
{
  "dataSourceId": 1,
  "tableNames": ["sys_user"],
  "templateGroupId": 1,
  "globalConfig": {
    "author": "admin",
    "packageName": "com.example.demo",
    "moduleName": "system",
    "tablePrefix": "sys_"
  }
}
```

## 内置模板

1. **Spring Boot + MyBatis Plus**（6个文件）
   - Entity、Mapper、Mapper.xml、Service、ServiceImpl、Controller

2. **TypeScript Frontend**（3个文件）
   - types.ts、api.ts、components.tsx

3. **Spring Boot + JPA**（5个文件）
   - Entity、Repository、Service、ServiceImpl、Controller

4. **Go + Gin + GORM (DDD)**（6个文件）
   - model、dto、repository、service、handler、router

## 许可证

MIT
