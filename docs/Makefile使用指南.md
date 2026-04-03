# Makefile 使用指南

CodeForge 项目提供了 Makefile 来简化常用操作，提高开发效率。

## 快速开始

### 查看所有命令

```bash
make help
```

### 最常用的命令

```bash
# 快速启动（一键安装依赖并启动服务）
make quick

# 安装依赖
make install

# 启动开发服务器
make dev          # 同时启动前后端
make dev-server   # 仅启动后端
make dev-web      # 仅启动前端

# 停止所有服务
make stop

# 检查开发环境
make doctor
```

## 命令分类

### 通用命令

| 命令 | 说明 |
|------|------|
| `make help` | 显示所有可用命令 |
| `make install` | 安装所有依赖 |
| `make install-server` | 仅安装后端依赖 |
| `make install-web` | 仅安装前端依赖 |

### 开发命令

| 命令 | 说明 |
|------|------|
| `make dev` | 同时启动前后端开发服务器 |
| `make dev-server` | 启动后端开发服务器 (http://localhost:3000) |
| `make dev-web` | 启动前端开发服务器 (http://localhost:5173) |
| `make stop` | 停止所有开发服务器 |

### 构建命令

| 命令 | 说明 |
|------|------|
| `make build` | 构建前端和后端 |
| `make build-server` | 仅构建后端 |
| `make build-web` | 仅构建前端 |
| `make prod-build` | 生产环境构建 |
| `make prod-start` | 启动生产环境服务 |

### 测试命令

| 命令 | 说明 |
|------|------|
| `make test` | 运行所有测试 |
| `make test-server` | 运行后端测试 |
| `make test-web` | 运行前端测试 |
| `make test-e2e` | 运行端到端测试 |

### 代码质量

| 命令 | 说明 |
|------|------|
| `make lint` | 检查代码规范 |
| `make lint-server` | 检查后端代码规范 |
| `make lint-web` | 检查前端代码规范 |
| `make format` | 格式化所有代码 |
| `make format-server` | 格式化后端代码 |
| `make format-web` | 格式化前端代码 |
| `make format-check` | 检查代码格式 |

### 数据库命令

| 命令 | 说明 |
|------|------|
| `make db-clean` | 清理数据库文件 |
| `make db-reset` | 重置数据库 |
| `make db-backup` | 备份数据库 |
| `make inspect-db` | 查看数据库信息 |
| `make templates-reset` | 仅重置内置模板（保留数据源/历史/配置） |

### 清理命令

| 命令 | 说明 |
|------|------|
| `make clean` | 清理构建文件（不删除依赖） |
| `make clean-all` | 清理所有（包括 node_modules、数据库、锁文件） |
| `make clean-cache` | 清理 pnpm 缓存 |

### 工具命令

| 命令 | 说明 |
|------|------|
| `make doctor` | 检查开发环境 |
| `make ps` | 查看运行中的服务 |
| `make ports` | 查看端口占用情况 |
| `make upgrade` | 升级依赖包 |
| `make upgrade-interactive` | 交互式升级依赖包 |
| `make outdated` | 查看过期的依赖包 |

### 快速启动

| 命令 | 说明 |
|------|------|
| `make quick` | 快速启动（安装依赖 + 启动服务） |
| `make quick-server` | 快速启动后端 |
| `make quick-web` | 快速启动前端 |
| `make fresh` | 全新安装并启动（清理 + 安装 + 启动） |

### 模板管理

| 命令 | 说明 |
|------|------|
| `make templates` | 列出所有内置模板 |
| `make validate-templates` | 验证模板文件完整性 |

### Git 命令

| 命令 | 说明 |
|------|------|
| `make git-status` | 查看 Git 状态 |
| `make git-log` | 查看提交日志 |
| `make git-clean` | 清理未跟踪的文件 |

### 文档命令

| 命令 | 说明 |
|------|------|
| `make docs` | 查看项目文档 |
| `make readme` | 查看 README |
| `make info` | 显示项目信息 |
| `make version` | 显示版本信息 |

### 调试命令

| 命令 | 说明 |
|------|------|
| `make debug-server` | 调试模式启动后端 |
| `make logs` | 查看最近的日志 |

## 常见使用场景

### 场景 1：首次启动项目

```bash
# 方式一：一键启动
make quick

# 方式二：分步执行
make install
make dev
```

### 场景 2：日常开发

```bash
# 启动开发服务器
make dev

# 或者分别启动
make dev-server  # 终端1
make dev-web     # 终端2
```

### 场景 3：代码提交前

```bash
# 检查代码规范
make lint

# 格式化代码
make format

# 运行测试
make test
```

### 场景 4：数据库问题排查

```bash
# 查看数据库信息
make inspect-db

# 重置数据库
make db-reset

# 仅重置内置模板（不清空业务数据）
make templates-reset

# 备份数据库
make db-backup
```

### 场景 5：清理和重置

```bash
# 清理构建文件
make clean

# 完全重置项目
make fresh

# 仅重置内置模板（后端需已启动）
make templates-reset
```

### 场景 6：依赖管理

```bash
# 查看过期的依赖
make outdated

# 升级依赖
make upgrade

# 交互式升级
make upgrade-interactive
```

### 场景 7：生产部署

```bash
# 构建生产版本
make prod-build

# 启动生产环境
make prod-start
```

### 场景 8：环境检查

```bash
# 检查开发环境
make doctor

# 查看端口占用
make ports

# 查看运行中的服务
make ps
```

## Windows 下的使用

### 安装 Make

Windows 下可以通过以下方式安装 Make：

1. **使用 Chocolatey**（推荐）：
   ```powershell
   choco install make
   ```

2. **使用 Scoop**：
   ```powershell
   scoop install make
   ```

3. **使用 Git Bash**：
   Git for Windows 自带 make 命令，可以在 Git Bash 中使用。

4. **WSL（Windows Subsystem for Linux）**：
   在 WSL 中使用 Linux 的 make 命令。

### 替代方案

如果不想安装 Make，可以直接使用 package.json 中的 npm/pnpm scripts：

```bash
# 等同于 make dev
pnpm dev

# 等同于 make dev-server
pnpm dev:server

# 等同于 make dev-web
pnpm dev:web

# 等同于 make build
pnpm build
```

## 技巧和最佳实践

### 1. 使用 Tab 自动补全

在支持的 Shell 中，输入 `make` 后按 Tab 键可以看到所有可用的目标。

### 2. 组合使用命令

```bash
# 清理后重新启动
make clean && make dev

# 格式化后检查
make format && make lint

# 测试后构建
make test && make build
```

### 3. 查看命令执行的详细信息

Makefile 中的命令都有输出提示，如果需要查看更多细节，可以：

```bash
# 查看正在运行的进程
make ps

# 查看端口占用
make ports

# 查看数据库状态
make inspect-db
```

### 4. 快速排查问题

```bash
# 检查环境
make doctor

# 重置一切
make fresh

# 重置数据库
make db-reset
```

## 自定义 Makefile

如果需要添加自己的命令，可以编辑项目根目录的 `Makefile` 文件。

示例：添加一个自定义命令

```makefile
##@ 自定义命令

my-command: ## 我的自定义命令
	@echo "$(GREEN)正在执行自定义命令...$(NC)"
	# 在这里添加你的命令
```

然后运行：

```bash
make my-command
```

## 故障排除

### 问题：make 命令找不到

**解决方案**：确保已安装 Make 工具，或使用 pnpm 命令替代。

### 问题：端口已被占用

**解决方案**：
```bash
# 停止所有服务
make stop

# 查看端口占用
make ports

# 然后重新启动
make dev
```

### 问题：数据库初始化失败

**解决方案**：
```bash
# 重置数据库
make db-reset

# 重新启动后端
make dev-server
```

### 问题：依赖安装失败

**解决方案**：
```bash
# 清理并重新安装
make clean-all
make install
```

## 更多帮助

- 查看所有命令：`make help`
- 查看项目信息：`make info`
- 查看版本信息：`make version`
- 查看文档列表：`make docs`
