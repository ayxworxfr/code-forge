## 一、项目概述

### 1.1 背景与目标

在中后台项目中，大量 CRUD 代码结构重复（Entity → Mapper → Service → Controller → 前端 API → 类型定义）。本项目旨在构建一个**本地 Web 端代码生成器**，通过连接数据库或粘贴 DDL，基于可自定义的模板引擎，一键批量生成标准化代码并打包下载。

### 1.2 核心能力

| 能力 | 说明 |
|------|------|
| **多数据源管理** | 支持配置多个 MySQL 数据源，可测试连接、浏览表结构 |
| **DDL 解析** | 无需连接数据库，粘贴 CREATE TABLE 即可解析生成 |
| **模板引擎** | 基于 Nunjucks，内置 3 套模板组，支持在线编辑和自定义 |
| **在线预览** | 生成前可逐文件预览代码，带语法高亮 |
| **批量生成** | 多表 × 多模板文件，一键生成 ZIP 下载 |
| **类型映射** | MySQL → Java / TypeScript / JDBC 类型可配置 |
| **零外部依赖** | SQLite 嵌入式存储，无需额外数据库服务 |
| **国际化 (i18n)** | 支持中文/英文界面切换，文案按语言包管理，错误信息可本地化 |

### 1.3 非目标（不做）

- 不做用户登录 / 权限管理（本地工具，单用户使用）
- 不做数据库写操作（只读元数据）
- 不做在线部署/推送到 Git
- 不支持 PostgreSQL / Oracle（1.0 仅 MySQL，架构预留扩展）

---

## 二、技术选型

### 2.1 总体架构

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │  HTTP   │   NestJS     │  TCP    │   MySQL      │
│   React SPA  │ ◄─────► │   后端服务    │ ◄─────► │   (用户库)    │
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │
                          ┌─────▼─────┐
                          │  SQLite   │
                          │  本地存储  │
                          └───────────┘
```

### 2.2 技术栈对比与选型

#### 后端框架

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **NestJS** | 模块化架构、TS 原生、装饰器路由、生态成熟 | 学习曲线稍陡 | ✅ **采用** |
| Express | 简单灵活 | 大项目缺乏结构约束 | ❌ |
| Fastify | 性能最优 | 生态不如 NestJS | ❌ |
| Java (Spring Boot) | 企业级成熟 | 前后端语言不统一，启动慢 | ❌ |

**选型理由**: NestJS 提供开箱即用的模块化 + 依赖注入 + 装饰器路由，与前端 TypeScript 统一语言栈，适合中等规模工具型应用。

#### 前端框架

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **React 18** | 生态最大、Hooks 成熟、社区资源丰富 | JSX 学习成本 | ✅ **采用** |
| Vue 3 | 模板语法直观 | 复杂状态管理不如 React 灵活 | ❌ |
| Svelte | 编译时优化，体积小 | 生态偏小，组件库少 | ❌ |

#### UI 组件库

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **Ant Design 5** | 组件最全、中后台首选、Table/Form 强大 | 体积较大 | ✅ **采用** |
| Arco Design | 字节系，设计精良 | 社区不如 AntD | ❌ |
| Shadcn/ui | 高度可定制、现代风 | 组件需逐个安装，Table 偏弱 | ❌ |

**选型理由**: 代码生成器属于典型中后台工具，需要大量 Table、Form、Modal、Tree 组件，Ant Design 5 最为匹配。

#### 数据库

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **SQLite (sql.js)** | 零部署、嵌入式、纯 JS 方案，跨平台安装更稳定 | 不适合高并发 | ✅ **采用** |
| LowDB / JSON 文件 | 极简 | 无法高效查询，数据量大后性能差 | ❌ |
| MySQL / PostgreSQL | 功能强大 | 增加外部依赖，违背"零部署"目标 | ❌ |

**选型理由**: 本地单用户工具，数据量小（配置 + 模板 + 历史），SQLite 同步 API 简洁高效，无需额外安装。

#### 模板引擎

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **Nunjucks** | 语法强大（继承/宏/过滤器）、社区成熟 | 略重 | ✅ **采用** |
| EJS | 简单易学 | 无模板继承、过滤器需自实现 | ❌ |
| Handlebars | 逻辑少，安全 | 太弱，复杂代码模板力不从心 | ❌ |
| Art-template | 性能最快 | 高级功能不足 | ❌ |

**选型理由**: 代码模板需要条件判断、循环、过滤器、宏等高级能力，Nunjucks 功能最完备。

#### 代码编辑器

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **Monaco Editor** | VSCode 同款引擎、语法高亮/补全/多语言 | 体积大 (~2MB) | ✅ **采用** |
| CodeMirror 6 | 轻量、可扩展 | 多语言支持需额外配置 | ❌ |
| Prism.js | 极轻量 | 只做展示，无编辑能力 | ❌ |

#### 包管理 & 构建

| 工具 | 用途 |
|------|------|
| **pnpm workspace** | Monorepo 管理 `packages/server` + `packages/web` |
| **Vite 5** | 前端构建，开发秒启 |
| **tsup** | 后端 TypeScript 构建（可选，NestJS 自带 tsc） |

#### 国际化方案

| 候选 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **i18next + react-i18next** | 生态成熟、支持命名空间/插值/复数、前端集成成本低 | 需维护语言包 | ✅ **采用** |
| react-intl | ICU 语法强、格式化能力完善 | 心智负担略高，和现有中后台模板搭配不如 i18next 直观 | ❌ |
| LinguiJS | 编译优化较好 | 社区规模相对小 | ❌ |

**选型理由**: 本项目属于本地工具 + 中后台界面，文案数量可控，优先追求接入简单、迭代快、易维护，`i18next + react-i18next` 更匹配。

### 2.3 完整技术栈一览

```
前端: React 18 + TypeScript + Ant Design 5 + Zustand + React Router 6 + Monaco Editor + i18next + react-i18next + Vite 5
后端: NestJS 10 + TypeScript + sql.js + Nunjucks + mysql2 + Archiver + node-sql-parser
存储: SQLite 3 (嵌入式)
工程: pnpm workspace (Monorepo)
```

---

## 三、系统架构设计

### 3.1 整体分层

```
┌─────────────────────────────────────────────────┐
│                  前端 (React SPA)                │
│  页面层: 生成器 | 数据源 | 模板 | 类型映射 | 设置   │
│  状态层: Zustand Store                           │
│  请求层: Axios → /api/*                          │
├─────────────────────────────────────────────────┤
│                  后端 (NestJS)                   │
│  Controller 层 ── 路由/参数校验                   │
│  Service 层    ── 业务逻辑                        │
│  Repository 层 ── SQLite 数据存取                 │
│  Engine 层     ── Nunjucks 模板渲染               │
│  Connector 层  ── MySQL 远程连接                  │
│  Parser 层     ── DDL SQL 解析                   │
├─────────────────────────────────────────────────┤
│                  数据层                          │
│  SQLite: 数据源配置 | 模板内容 | 类型映射 | 历史   │
│  MySQL:  远程只读(用户的业务库，读取表结构元数据)   │
└─────────────────────────────────────────────────┘
```

### 3.2 Monorepo 项目结构

```
codeforge/
├── package.json                    # 根配置
├── pnpm-workspace.yaml
├── packages/
│   ├── server/                     # NestJS 后端
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── database/           # SQLite 初始化 + 种子数据
│   │   │   └── modules/
│   │   │       ├── datasource/     # 数据源管理 + MySQL 连接
│   │   │       ├── generator/      # 代码生成核心 + Nunjucks 引擎
│   │   │       ├── template/       # 模板组/模板文件 CRUD
│   │   │       ├── type-mapping/   # 类型映射管理
│   │   │       ├── config/         # 全局配置
│   │   │       └── history/        # 生成历史
│   │   └── package.json
│   └── web/                        # React 前端
│       ├── src/
│       │   ├── pages/              # 页面组件
│       │   ├── api/                # API 调用层
│       │   ├── stores/             # Zustand 状态
│       │   ├── components/         # 通用组件
│       │   ├── types/              # TS 类型定义
│       │   ├── router/             # 路由配置
│       │   └── locales/            # 前端语言包 (zh-CN / en-US)
│       └── package.json
└── data/
    └── codeforge.db                # SQLite 数据库文件 (运行时生成)
```

### 3.3 后端模块依赖关系

```
                    AppModule
                       │
       ┌───────┬───────┼───────┬──────────┬──────────┐
       ▼       ▼       ▼       ▼          ▼          ▼
  Datasource Template TypeMapping Config History  Generator
       │       │       │                              │
       │       │       │         ┌────────────────────┤
       ▼       ▼       ▼         ▼                    ▼
   [mysql2] [SQLite] [SQLite]  TemplateEngine    DDLParser
                                (Nunjucks)     (node-sql-parser)
```

**核心原则**: Generator 模块是中心消费者，组合调用 Datasource（获取表结构）、Template（获取模板）、TypeMapping（类型转换）来完成代码生成。

---

## 四、数据库设计

### 4.1 ER 图

```
┌─────────────────┐     ┌─────────────────┐
│   data_source   │     │ template_group   │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ name            │     │ name            │
│ host / port     │     │ description     │
│ username / pwd  │     │ is_builtin      │
│ database_name   │     │ tags (JSON)     │
│ created_at      │     │ created_at      │
└─────────────────┘     └────────┬────────┘
                                 │ 1:N
                        ┌────────▼────────┐
                        │ template_file    │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ group_id (FK)   │
                        │ file_name       │
                        │ output_path     │
                        │ content (模板)   │
                        │ language        │
                        │ enabled         │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  type_mapping   │     │ global_config    │     │ gen_history      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ source_type     │     │ config_key (UQ) │     │ datasource_id   │
│ java_type       │     │ config_value    │     │ table_names     │
│ ts_type         │     │ description     │     │ template_group  │
│ jdbc_type       │     └─────────────────┘     │ config_snapshot │
│ is_builtin      │                              │ file_count      │
└─────────────────┘                              │ created_at      │
                                                  └─────────────────┘
```

### 4.2 核心表说明

| 表名 | 记录量级 | 说明 |
|------|----------|------|
| `data_source` | ~10 条 | 用户配置的 MySQL 连接信息，密码加密存储 |
| `template_group` | ~10 组 | 模板组（内置 3 组 + 用户自定义） |
| `template_file` | ~50 个 | 每组含 3~8 个模板文件，存储 Nunjucks 模板内容 |
| `type_mapping` | ~30 条 | MySQL 类型 → Java/TS/JDBC 类型的映射规则 |
| `global_config` | ~15 条 | KV 形式全局默认配置（含 `defaultLocale`、`supportedLocales`） |
| `gen_history` | ~数百条 | 每次生成记录快照，支持回溯和重新生成 |

### 4.3 关键设计决策

| 决策 | 理由 |
|------|------|
| 模板内容存数据库而非文件系统 | 便于 CRUD、导入导出、版本管理，避免文件路径问题 |
| `is_builtin` 标记 | 内置模板/映射可重置但不可硬删除，用户自定义的可任意操作 |
| 密码 AES 加密存储 | 虽是本地工具，仍避免明文密码写入 SQLite 文件 |
| 历史快照用 JSON | `config_snapshot` 记录生成时的完整配置，脱离外键依赖 |
| 语言包按命名空间管理 | 通用文案和业务文案分离，降低多人协作时冲突 |

---

## 五、核心模块设计

### 5.1 数据源模块 (Datasource)

**职责**: 管理 MySQL 连接配置，提供表结构元数据查询。

```
功能清单:
├── CRUD 数据源配置
├── 测试连接 (返回版本号、延迟)
├── 获取表列表 (information_schema.TABLES)
├── 获取列详情 (information_schema.COLUMNS)
└── DDL 解析 (node-sql-parser)
```

**连接管理策略**:
- 使用 `mysql2` 创建**短连接**（每次查询新建连接），不维护连接池
- 理由：用户可能配置多个数据源但同时只操作一个，长连接浪费资源
- 连接超时：5 秒

**DDL 解析方案**:
- 使用 `node-sql-parser` 解析 CREATE TABLE AST
- 从 AST 中提取：表名、注释、每列的名称/类型/注释/主键/Nullable/默认值
- 不需要真实数据库连接

### 5.2 模板模块 (Template)

**职责**: 模板组和模板文件的 CRUD，以及克隆、排序管理。

```
功能清单:
├── 模板组 CRUD (含 is_builtin 保护)
├── 模板文件 CRUD
├── 复制模板组 (深拷贝所有文件)
└── 模板文件排序调整
```

**导出格式**:
```json
{
  "name": "Spring Boot + MyBatis Plus",
  "version": "1.0.0",
  "files": [
    {
      "fileName": "Entity.java.njk",
      "outputPath": "...",
      "content": "...",
      "language": "java"
    }
  ]
}
```

### 5.3 代码生成模块 (Generator) ⭐ 核心

**职责**: 组合数据源、模板、类型映射，执行渲染并输出。

#### 5.3.1 生成流程

```
                        ┌──────────────────┐
                        │   用户请求         │
                        │ (表名/DDL+模板组)  │
                        └────────┬─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  1. 获取表结构元数据       │
                    │  (MySQL 查询 或 DDL 解析) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  2. 构建模板上下文         │
                    │  (列信息 + 类型映射转换)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  3. 加载模板文件           │
                    │  (从 SQLite 读取内容)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  4. Nunjucks 渲染         │
                    │  (模板 + 上下文 → 代码)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  5. 输出                  │
                    │  预览: 返回 JSON          │
                    │  下载: 打包 ZIP (Archiver) │
                    └──────────────────────────┘
```

#### 5.3.2 模板上下文数据结构

这是传入 Nunjucks 模板的核心数据：

```
context = {
  global: {
    author          // 作者名
    date            // 日期 YYYY-MM-DD
    packageName     // Java 包名
    packagePath     // 包路径 (com/example/demo)
    moduleName      // 模块名
  },
  table: {
    tableName       // 原始表名 sys_user
    tableComment    // 表注释
    shortClassName  // 去前缀+帕斯卡 → User
    shortCamelName  // 去前缀+驼峰 → user
    pkColumn        // 主键列对象
    columns: [      // 所有列
      {
        columnName    // 原始列名
        dataType      // MySQL 类型
        comment       // 注释
        isPK          // 是否主键
        nullable      // 是否可空
        javaField     // Java 字段名 (驼峰)
        javaType      // Java 类型 (通过类型映射)
        tsField       // TS 字段名
        tsType        // TS 类型 (通过类型映射)
        jdbcType      // JDBC 类型
        length        // 字符长度
        ...
      }
    ],
    javaImports     // 需要 import 的 Java 类列表 (去重)
  }
}
```

#### 5.3.3 类型映射转换逻辑

```
优先级规则 (精确匹配优先):
  1. 完全匹配: tinyint(1) → Boolean  ✅ 命中
  2. 基础匹配: tinyint    → Integer  (tinyint(4) 走这条)
  3. 无匹配:   fallback → String
```

#### 5.3.4 ZIP 打包策略

使用 `archiver` 库，按模板中定义的 `outputPath` 组织目录结构：

```
generated-code.zip
├── src/main/java/com/example/demo/system/
│   ├── entity/User.java
│   ├── mapper/UserMapper.java
│   ├── service/UserService.java
│   ├── service/impl/UserServiceImpl.java
│   └── controller/UserController.java
├── src/main/resources/mapper/system/
│   └── UserMapper.xml
└── (多张表时，每张表都生成一套)
```

### 5.4 类型映射模块 (TypeMapping)

**职责**: 维护 MySQL 源类型到 Java/TypeScript/JDBC 类型的映射关系。

```
功能清单:
├── 映射列表查询
├── 新增自定义映射
├── 编辑映射
├── 删除映射 (内置的标记删除)
└── 重置为默认 (恢复内置映射)
```

**内置映射覆盖范围** (约 30 条):

| MySQL 类型 | Java | TypeScript | JDBC |
|-----------|------|-----------|------|
| bigint | Long | number | BIGINT |
| int/integer | Integer | number | INTEGER |
| tinyint(1) | Boolean | boolean | BOOLEAN |
| tinyint | Integer | number | TINYINT |
| varchar/char | String | string | VARCHAR |
| text/longtext | String | string | CLOB |
| datetime/timestamp | LocalDateTime | string | TIMESTAMP |
| date | LocalDate | string | DATE |
| decimal | BigDecimal | string | DECIMAL |
| json | String | Record | VARCHAR |
| ... | ... | ... | ... |

### 5.5 全局配置模块 (Config)

KV 存储，提供默认值：

| Key | 默认值 | 说明 |
|-----|-------|------|
| defaultAuthor | admin | @author 标注 |
| defaultPackageName | com.example.demo | Java 包名 |
| defaultModuleName | system | 模块名 |
| defaultTablePrefix | sys_ | 表前缀 |
| defaultTemplateGroupId | 1 | 默认模板组 |
| defaultLocale | zh-CN | 默认语言 |
| supportedLocales | zh-CN,en-US | 支持的语言列表 |

### 5.6 生成历史模块 (History)

每次批量生成时自动记录：
- 使用了哪个数据源 / 哪些表
- 使用了哪个模板组
- 当时的全局配置快照 (JSON)
- 生成文件数量

支持**"使用此配置重新生成"**功能，从快照恢复配置。

### 5.7 国际化模块 (I18n)

**职责**: 前端基于 `i18next` 管理多语言文案，后端通过全局配置提供默认语言参数。

```
功能清单:
├── 前端语言包加载 (按 namespace 分片管理)
├── 前端运行时切换语言 (无刷新)
├── 设置页持久化默认语言 (`defaultLocale`)
└── 配置支持语言列表 (`supportedLocales`)
```

**语言协商优先级**:
1. 用户在设置页保存的默认语言 (`global_config.defaultLocale`)
2. 前端 i18next fallback 语言
3. 系统默认 `zh-CN`

**语言包目录建议**:
```
packages/web/src/locales/
├── zh-CN/
│   ├── common.json
│   ├── generator.json
│   └── datasource.json
└── en-US/
    ├── common.json
    ├── generator.json
    └── datasource.json
```

---

## 六、API 接口设计

### 6.1 接口总览

| 模块 | Method | Path | 说明 |
|------|--------|------|------|
| **数据源** | GET | `/api/datasource` | 列表 |
| | POST | `/api/datasource` | 新增 |
| | PUT | `/api/datasource/:id` | 编辑 |
| | DELETE | `/api/datasource/:id` | 删除 |
| | POST | `/api/datasource/test/:id` | 测试连接 |
| | GET | `/api/datasource/:id/tables` | 获取表列表 |
| | GET | `/api/datasource/:id/tables/:tableName` | 获取表详情 |
| | POST | `/api/datasource/parse-ddl` | 解析 DDL |
| **模板** | GET | `/api/template/groups` | 模板组列表 |
| | GET | `/api/template/groups/:id` | 模板组详情 |
| | GET | `/api/template/groups/:id/files` | 模板组详情（含文件） |
| | POST | `/api/template/groups` | 新增模板组 |
| | PUT | `/api/template/groups/:id` | 编辑模板组 |
| | DELETE | `/api/template/groups/:id` | 删除模板组 |
| | POST | `/api/template/groups/:id/clone` | 克隆模板组 |
| | GET | `/api/template/files/:id` | 查询模板文件 |
| | POST | `/api/template/files` | 新增模板文件 |
| | PUT | `/api/template/files/:id` | 编辑模板文件 |
| | DELETE | `/api/template/files/:id` | 删除模板文件 |
| | PUT | `/api/template/files/order` | 调整模板文件排序 |
| **生成器** | POST | `/api/generator/preview` | 单文件预览 |
| | POST | `/api/generator/generate` | 批量生成下载 ZIP |
| **类型映射** | GET | `/api/type-mapping` | 列表 |
| | POST | `/api/type-mapping` | 新增 |
| | PUT | `/api/type-mapping/:id` | 编辑 |
| | DELETE | `/api/type-mapping/:id` | 删除 |
| | POST | `/api/type-mapping/reset` | 重置为默认 |
| **配置** | GET | `/api/config` | 获取全局配置 |
| | PUT | `/api/config` | 更新全局配置 |
| **历史** | GET | `/api/history` | 查询历史（支持 `limit`） |
| | DELETE | `/api/history/:id` | 删除单条 |
| | DELETE | `/api/history` | 清空全部 |

### 6.2 统一响应格式

```json
// 成功
{ "code": 0, "message": "success", "data": { ... } }

// 失败
{ "code": 1001, "message": "数据源连接失败: Connection refused", "data": null }
```

### 6.3 核心接口示例

**POST /api/generator/generate** (批量生成)

请求:
```json
{
  "dataSourceId": 1,
  "tableNames": ["sys_user", "sys_role"],
  "templateGroupId": 1,
  "templateFileIds": [1, 2, 3, 4, 5, 6],
  "globalConfig": {
    "author": "zhangsan",
    "packageName": "com.example.demo",
    "moduleName": "system",
    "tablePrefix": "sys_"
  }
}
```

响应: `Content-Type: application/zip` (二进制流)

---

## 七、前端页面设计

### 7.1 页面结构

```
┌──────────┬─────────────────────────────────────────────┐
│ 侧边导航  │  内容区                                      │
│          │                                             │
│ ⚡ 代码生成│  (根据路由渲染对应页面)                        │
│ 🔌 数据源 │                                             │
│ 📋 模板   │                                             │
│ 🔄 类型映射│                                             │
│ 📜 历史   │                                             │
│ ⚙️ 设置   │                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

### 7.2 代码生成主页 (核心页面)

```
┌──────────────────────────────────────────────────────────────┐
│ ⚡ 代码生成                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌── 全局配置栏 ───────────────────────────────────────────┐  │
│ │ [数据源▼]  [模板组▼]  [◉数据库连接 ○DDL粘贴]              │  │
│ │ [包名____] [模块名__] [表前缀__] [作者____]              │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌── 左面板: 表选择 ─────┐  ┌── 右面板: 代码预览 ────────┐   │
│ │ [🔍搜索___] [☑全选]    │  │ [Entity] [Mapper] [Service]│   │
│ │                        │  │ [Controller] [XML]         │   │
│ │ ☑ sys_user    用户表   │  │ ┌─────────────────────────┐│   │
│ │ ☑ sys_role    角色表   │  │ │  package com.example... ││   │
│ │ ☐ sys_menu    菜单表   │  │ │                         ││   │
│ │ ☐ sys_dept    部门表   │  │ │  @Data                  ││   │
│ │                        │  │ │  @TableName("sys_user") ││   │
│ │ ── 当前表列信息 ──     │  │ │  public class User {    ││   │
│ │ 🔑id   bigint  主键    │  │ │    ...                  ││   │
│ │   name varchar 用户名  │  │ │  }                      ││   │
│ │   age  int     年龄    │  │ └─────────────────────────┘│   │
│ └────────────────────────┘  └────────────────────────────┘   │
│                                                              │
│              [🧪 生成预览包]   [⬇ 下载 ZIP]                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 数据源管理页

```
┌──────────────────────────────────────────────────┐
│ 🔌 数据源管理                        [+ 新增]     │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │ 开发环境 │  │ 测试环境 │  │ 生产环境 │            │
│  │ 🟢 已连接│  │ 🔴 失败 │  │ ⚪ 未测试│            │
│  │ 3306   │  │ 3306   │  │ 3306   │            │
│  │ [编辑]  │  │ [编辑]  │  │ [编辑]  │            │
│  │ [测试]  │  │ [测试]  │  │ [测试]  │            │
│  │ [删除]  │  │ [删除]  │  │ [删除]  │            │
│  └────────┘  └────────┘  └────────┘            │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.4 模板管理页

```
┌──────────────────────────────────────────────────┐
│ 📋 模板管理                          [+ 新增模板组]│
├──────────────────────────────────────────────────┤
│                                                  │
│  Spring Boot + MyBatis Plus    [内置] 6个文件     │
│  TypeScript Frontend           [内置] 3个文件     │
│  Spring Boot + JPA             [内置] 5个文件     │
│  我的自定义模板                  [自定义] 4个文件    │
│                                                  │
│  操作: [在线编辑] [复制] [导出] [删除]             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.5 模板在线编辑页

```
┌──────────────────────────────────────────────────────────────┐
│ 📋 编辑模板: Spring Boot + MyBatis Plus          [保存] [返回]│
├───────────────┬──────────────────────────────────────────────┤
│ 文件列表       │  Monaco Editor                              │
│               │                                              │
│ ▸ Entity.java │  {# Entity.java.njk #}                      │
│   Mapper.java │  package {{ global.packageName }}...         │
│   Mapper.xml  │                                              │
│   Service     │  @Data                                       │
│   ServiceImpl │  @TableName("{{ table.tableName }}")         │
│   Controller  │  public class {{ table.shortClassName }} {   │
│               │    {% for col in table.columns %}            │
│ [+ 新增文件]   │    ...                                      │
│               │                                              │
├───────────────┤  文件名: Entity.java.njk                     │
│ 可用变量参考    │  输出路径: {{ packagePath }}/entity/...       │
│               │  语言: java                                  │
│ global.*      │                                              │
│ table.*       │  [语法校验 ✅]                                │
│ table.columns │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### 7.6 类型映射配置页

```
┌──────────────────────────────────────────────────────────────┐
│ 🔄 类型映射                      [+ 新增映射] [重置为默认]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  MySQL类型     │ Java类型        │ TS类型    │ JDBC    │ 操作 │
│  bigint       │ Long            │ number   │ BIGINT  │ ✏️🗑 │
│  int          │ Integer         │ number   │ INTEGER │ ✏️🗑 │
│  tinyint(1)   │ Boolean         │ boolean  │ BOOLEAN │ ✏️🗑 │
│  varchar      │ String          │ string   │ VARCHAR │ ✏️🗑 │
│  datetime     │ LocalDateTime   │ string   │ TSTAMP  │ ✏️🗑 │
│  decimal      │ BigDecimal      │ string   │ DECIMAL │ ✏️🗑 │
│  ...          │ ...             │ ...      │ ...     │      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.7 设置页（国际化）

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ 设置                                                      │
├──────────────────────────────────────────────────────────────┤
│  语言偏好                                                     │
│  [默认语言 ▼ 简体中文 / English ]                             │
│  [跟随系统语言 ☑]                                             │
│                                                              │
│  文案加载状态                                                 │
│  common      ✅ 已加载                                         │
│  generator   ✅ 已加载                                         │
│  datasource  ✅ 已加载                                         │
│                                                              │
│  [保存设置]                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 八、内置模板设计

### 8.1 模板组规划

| # | 模板组名称 | 文件数 | 目标场景 |
|---|-----------|-------|---------|
| 1 | Spring Boot + MyBatis Plus | 6 | Java 后端 CRUD 全套 |
| 2 | TypeScript Frontend | 3 | 前端类型 + API + 组件 |
| 3 | Spring Boot + JPA | 5 | JPA 风格后端 |
| 4 | Go + Gin + GORM (DDD) | 6 | Go 分层后端（实体/DTO/仓储/服务/处理器/路由） |

### 8.2 模板组 1 文件清单

| 文件 | 输出路径 | 说明 |
|------|---------|------|
| Entity.java.njk | `{pkg}/entity/{Class}.java` | MP 实体类 @TableName |
| Mapper.java.njk | `{pkg}/mapper/{Class}Mapper.java` | BaseMapper 接口 |
| Mapper.xml.njk | `mapper/{module}/{Class}Mapper.xml` | ResultMap + Base_Column |
| Service.java.njk | `{pkg}/service/{Class}Service.java` | IService 接口 |
| ServiceImpl.java.njk | `{pkg}/service/impl/{Class}ServiceImpl.java` | ServiceImpl 实现 |
| Controller.java.njk | `{pkg}/controller/{Class}Controller.java` | REST CRUD 控制器 |

### 8.3 模板中可用的变量

```
global.author           → "zhangsan"
global.date             → "2026-03-30"
global.packageName      → "com.example.demo"
global.packagePath      → "com/example/demo"
global.moduleName       → "system"

table.tableName         → "sys_user"
table.tableComment      → "用户表"
table.shortClassName    → "User"          (去前缀 + 帕斯卡)
table.shortCamelName    → "user"          (去前缀 + 驼峰)
table.pkColumn          → { columnName: "id", javaType: "Long", ... }
table.columns[]         → 全部列
table.normalColumns[]   → 非主键列
table.javaImports[]     → ["java.time.LocalDateTime", ...]

column.columnName       → "user_name"
column.javaField        → "userName"      (驼峰)
column.javaType         → "String"        (通过类型映射)
column.tsField          → "userName"
column.tsType           → "string"        (通过类型映射)
column.comment          → "用户名"
column.isPK             → false
column.nullable         → false
column.autoIncrement    → false
column.length           → 64
column.jdbcType         → "VARCHAR"
```

### 8.4 自定义过滤器

| 过滤器 | 示例 | 结果 |
|--------|------|------|
| `camelCase` | `"user_name" \| camelCase` | `userName` |
| `pascalCase` | `"user_name" \| pascalCase` | `UserName` |
| `kebabCase` | `"userName" \| kebabCase` | `user-name` |
| `snakeCase` | `"userName" \| snakeCase` | `user_name` |
| `constantCase` | `"userName" \| constantCase` | `USER_NAME` |
| `pluralize` | `"user" \| pluralize` | `users` |
| `removePrefix` | `"sys_user" \| removePrefix("sys_")` | `user` |

---

## 九、关键流程时序图

### 9.1 代码预览流程

```
用户          前端                  后端 Generator       MySQL / DDLParser
 │             │                       │                      │
 │─ 点击预览 ──►│                       │                      │
 │             │── POST /preview ──────►│                      │
 │             │                       │── 查询表结构 ─────────►│
 │             │                       │◄── 列信息 ────────────│
 │             │                       │                      │
 │             │                       │── 查询类型映射 (SQLite)│
 │             │                       │── 构建 context        │
 │             │                       │── 加载模板 (SQLite)    │
 │             │                       │── Nunjucks 渲染       │
 │             │                       │                      │
 │             │◄── { code, filePath } │                      │
 │◄── 展示代码 ─│                       │                      │
```

### 9.2 批量生成下载流程

```
用户          前端                  后端 Generator
 │             │                       │
 │─ 点击生成 ──►│                       │
 │             │── POST /generate ─────►│
 │             │                       │── for 每张表:
 │             │                       │     查询列信息
 │             │                       │     构建 context
 │             │                       │     for 每个模板:
 │             │                       │       Nunjucks 渲染
 │             │                       │       写入 Archiver
 │             │                       │
 │             │                       │── 记录生成历史 (SQLite)
 │             │                       │── 输出 ZIP 流
 │             │◄── application/zip ───│
 │◄── 下载文件 ─│                       │
```

---

## 十、非功能性设计

### 10.1 性能预估

| 场景 | 预估耗时 | 说明 |
|------|----------|------|
| 测试数据源连接 | < 2s | 主要是网络延迟 |
| 加载 100 张表列表 | < 500ms | information_schema 查询 |
| 单表预览 6 个文件 | < 200ms | Nunjucks 渲染很快 |
| 10 张表 × 6 模板生成 ZIP | < 2s | 60 个文件，内存中打包 |

### 10.2 错误处理策略

| 场景 | 处理方式 |
|------|---------|
| 数据源连接失败 | 返回具体错误信息（Connection refused / Auth failed / Timeout） |
| DDL 解析失败 | 返回解析错误位置和原因 |
| 模板渲染失败 | 返回模板名 + 行号 + 错误详情 |
| 请求参数校验失败 | NestJS ValidationPipe 自动返回字段级错误 |

### 10.3 安全考量

| 项目 | 措施 |
|------|------|
| 数据源密码 | AES-256-CBC 加密存储，密钥从环境变量读取 |
| MySQL 连接 | 只执行 `SELECT` on `information_schema`，不操作用户数据 |
| SQL 注入 | 不拼接 SQL，表名通过白名单校验 |
| 模板注入 | Nunjucks 沙箱模式，不暴露 Node.js API |

### 10.4 可扩展性预留

| 扩展方向 | 当前设计如何支持 |
|---------|----------------|
| **支持 PostgreSQL** | Datasource 模块抽象 `DatabaseConnector` 接口，MySQL 和 PG 各自实现 |
| **支持更多语言映射** | type_mapping 表增加 `go_type` / `rust_type` 等列即可 |
| **模板市场** | 导入/导出已有 JSON 格式，未来可做远程模板仓库 |
| **自定义函数** | Nunjucks 过滤器/全局函数通过配置文件注册 |

### 10.5 国际化质量指标

| 指标 | 目标 |
|------|------|
| 首次渲染语言包加载 | < 300ms（本地环境） |
| 运行时切换语言 | < 150ms（不刷新页面） |
| 文案键缺失率 | 0（CI 校验） |
| 翻译一致性 | 公共命名空间统一维护（`common.*`） |

---

## 十一、部署方案

### 11.1 开发环境

```bash
# 安装依赖
pnpm install

# 同时启动前后端
pnpm dev
#   → 后端: http://localhost:3000
#   → 前端: http://localhost:5173 (Vite proxy → 3000)
```

### 11.2 生产部署

```bash
# 构建
pnpm build
#   → packages/web/dist/    (静态资源)
#   → packages/server/dist/ (编译后的 JS)

# 启动后端
cd packages/server
node dist/main.js
#   → http://localhost:3000/api
```

当前实现默认采用前后端分离部署（开发期前端由 Vite 提供）。单进程单端口托管静态资源可作为后续增强项。

### 11.3 环境变量

```env
PORT=3000                              # 服务端口
DB_PATH=../../data/codeforge.db        # SQLite 路径
ENCRYPTION_KEY=your-secret-key-here    # 密码加密密钥
DEFAULT_LOCALE=zh-CN                   # 默认语言
SUPPORTED_LOCALES=zh-CN,en-US          # 支持的语言列表
```

---

## 十二、开发计划

| 阶段 | 周期 | 内容 |
|------|------|------|
| **P0 - 基础框架** | 第 1 周 | Monorepo 搭建、SQLite 初始化、NestJS 框架、React 脚手架 |
| **P1 - 数据源** | 第 2 周 | 数据源 CRUD、MySQL 连接、表结构查询、DDL 解析 |
| **P2 - 模板引擎** | 第 3 周 | Nunjucks 集成、过滤器、上下文构建、类型映射 |
| **P3 - 代码生成** | 第 4 周 | 预览、批量生成、ZIP 打包、生成历史 |
| **P4 - 模板管理** | 第 5 周 | 模板组 CRUD、Monaco 在线编辑、导入导出 |
| **P5 - 完善优化** | 第 6 周 | 全局设置、暗色主题、国际化(i18n)、错误处理优化、文档 |

---

## 十三、总结

### 核心设计原则

1. **零外部依赖**: SQLite 嵌入式存储，npm install 后即可运行
2. **模板驱动**: 生成逻辑全在模板中，用户可完全自定义而不改代码
3. **前后端统一**: TypeScript 全栈，类型共享
4. **数据安全**: 只读 MySQL 元数据，密码加密存储
5. **可扩展**: 数据库类型、模板、类型映射均可按需扩展