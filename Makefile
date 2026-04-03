.PHONY: help install dev dev-server dev-web build clean test lint format stop db-clean db-reset doctor templates-reset

# 默认目标
.DEFAULT_GOAL := help

# 颜色定义
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
NC     := \033[0m # No Color

##@ 通用命令

help: ## 显示帮助信息
	@echo "$(GREEN)CodeForge - 代码生成器$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(YELLOW)用法:$(NC)\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

install: ## 安装所有依赖
	@echo "$(GREEN)正在安装依赖...$(NC)"
	pnpm install

install-server: ## 仅安装后端依赖
	@echo "$(GREEN)正在安装后端依赖...$(NC)"
	cd packages/server && pnpm install

install-web: ## 仅安装前端依赖
	@echo "$(GREEN)正在安装前端依赖...$(NC)"
	cd packages/web && pnpm install

##@ 开发命令

dev: ## 同时启动前端和后端开发服务器
	@echo "$(GREEN)正在启动前后端服务...$(NC)"
	@echo "$(YELLOW)后端: http://localhost:3000/api$(NC)"
	@echo "$(YELLOW)前端: http://localhost:5173$(NC)"
	@$(MAKE) -j2 dev-server dev-web

dev-server: ## 启动后端开发服务器
	@echo "$(GREEN)正在启动后端服务...$(NC)"
	cd packages/server && pnpm dev

dev-web: ## 启动前端开发服务器
	@echo "$(GREEN)正在启动前端服务...$(NC)"
	cd packages/web && pnpm dev

stop: ## 停止所有开发服务器
	@echo "$(GREEN)正在停止所有服务...$(NC)"
	@taskkill //F //IM node.exe 2>nul || pkill -f "node" 2>/dev/null || true
	@echo "$(GREEN)服务已停止$(NC)"

##@ 构建命令

build: ## 构建前端和后端
	@echo "$(GREEN)正在构建项目...$(NC)"
	pnpm build

build-server: ## 构建后端
	@echo "$(GREEN)正在构建后端...$(NC)"
	cd packages/server && pnpm build

build-web: ## 构建前端
	@echo "$(GREEN)正在构建前端...$(NC)"
	cd packages/web && pnpm build

##@ 测试命令

test: ## 运行所有测试
	@echo "$(GREEN)正在运行测试...$(NC)"
	pnpm test

test-server: ## 运行后端测试
	@echo "$(GREEN)正在运行后端测试...$(NC)"
	cd packages/server && pnpm test

test-web: ## 运行前端测试
	@echo "$(GREEN)正在运行前端测试...$(NC)"
	cd packages/web && pnpm test

test-e2e: ## 运行端到端测试
	@echo "$(GREEN)正在运行端到端测试...$(NC)"
	cd packages/server && pnpm test:e2e

##@ 代码质量

lint: ## 检查代码规范
	@echo "$(GREEN)正在检查代码规范...$(NC)"
	pnpm lint

lint-server: ## 检查后端代码规范
	@echo "$(GREEN)正在检查后端代码...$(NC)"
	cd packages/server && pnpm lint

lint-web: ## 检查前端代码规范
	@echo "$(GREEN)正在检查前端代码...$(NC)"
	cd packages/web && pnpm lint

format: ## 格式化所有代码
	@echo "$(GREEN)正在格式化代码...$(NC)"
	pnpm format

format-server: ## 格式化后端代码
	@echo "$(GREEN)正在格式化后端代码...$(NC)"
	cd packages/server && pnpm format

format-web: ## 格式化前端代码
	@echo "$(GREEN)正在格式化前端代码...$(NC)"
	cd packages/web && pnpm format

format-check: ## 检查代码格式
	@echo "$(GREEN)正在检查代码格式...$(NC)"
	@echo "$(YELLOW)提示: 如有问题请运行 make format$(NC)"

##@ 数据库命令

db-clean: ## 清理数据库文件
	@echo "$(GREEN)正在清理数据库...$(NC)"
	rm -f packages/data/codeforge.db
	@echo "$(GREEN)数据库已清理$(NC)"

db-reset: db-clean ## 重置数据库（删除后重启后端会自动初始化）
	@echo "$(YELLOW)数据库已清理，请重启后端服务以重新初始化$(NC)"
	@echo "$(YELLOW)运行: make dev-server$(NC)"

db-backup: ## 备份数据库
	@echo "$(GREEN)正在备份数据库...$(NC)"
	@mkdir -p backups
	@cp packages/data/codeforge.db backups/codeforge_$$(date +%Y%m%d_%H%M%S).db
	@echo "$(GREEN)备份完成$(NC)"

##@ 清理命令

clean: ## 清理构建文件
	@echo "$(GREEN)正在清理构建文件...$(NC)"
	rm -rf packages/server/dist
	rm -rf packages/web/dist
	rm -rf packages/web/node_modules/.vite
	@echo "$(GREEN)清理完成$(NC)"

clean-all: clean ## 清理所有（包括 node_modules）
	@echo "$(GREEN)正在清理所有文件...$(NC)"
	rm -rf node_modules
	rm -rf packages/server/node_modules
	rm -rf packages/web/node_modules
	rm -rf packages/data/codeforge.db
	rm -f pnpm-lock.yaml
	@echo "$(GREEN)清理完成$(NC)"

clean-cache: ## 清理缓存
	@echo "$(GREEN)正在清理缓存...$(NC)"
	pnpm store prune
	@echo "$(GREEN)缓存已清理$(NC)"

##@ 工具命令

doctor: ## 检查开发环境
	@echo "$(GREEN)正在检查开发环境...$(NC)"
	@echo ""
	@echo "$(BLUE)Node 版本:$(NC)"
	@node --version || echo "$(RED)✗ Node.js 未安装$(NC)"
	@echo ""
	@echo "$(BLUE)pnpm 版本:$(NC)"
	@pnpm --version || echo "$(RED)✗ pnpm 未安装$(NC)"
	@echo ""
	@echo "$(BLUE)数据库状态:$(NC)"
	@if [ -f packages/data/codeforge.db ]; then \
		echo "$(GREEN)✓ 数据库文件存在$(NC)"; \
		ls -lh packages/data/codeforge.db; \
	else \
		echo "$(YELLOW)⚠ 数据库文件不存在，首次启动后端会自动创建$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)项目结构:$(NC)"
	@echo "packages/server - NestJS 后端服务"
	@echo "packages/web    - React 前端应用"
	@echo "packages/data   - SQLite 数据库"

ps: ## 查看运行中的服务
	@echo "$(GREEN)正在查看运行中的 Node 进程...$(NC)"
	@ps aux | grep node | grep -v grep || echo "$(YELLOW)没有运行中的 Node 进程$(NC)"

ports: ## 查看端口占用情况
	@echo "$(GREEN)检查端口占用...$(NC)"
	@echo "$(BLUE)端口 3000 (后端):$(NC)"
	@lsof -ti:3000 2>/dev/null && echo "$(YELLOW)已占用$(NC)" || netstat -ano | findstr ":3000" 2>/dev/null || echo "$(GREEN)空闲$(NC)"
	@echo "$(BLUE)端口 5173 (前端):$(NC)"
	@lsof -ti:5173 2>/dev/null && echo "$(YELLOW)已占用$(NC)" || netstat -ano | findstr ":5173" 2>/dev/null || echo "$(GREEN)空闲$(NC)"

upgrade: ## 升级依赖包
	@echo "$(GREEN)正在升级依赖包...$(NC)"
	pnpm up

upgrade-interactive: ## 交互式升级依赖包
	@echo "$(GREEN)正在交互式升级依赖包...$(NC)"
	pnpm up -i

outdated: ## 查看过期的依赖包
	@echo "$(GREEN)正在查看过期依赖...$(NC)"
	pnpm outdated

##@ 快速启动

quick: install dev ## 快速启动（安装依赖 + 启动服务）

quick-server: install-server dev-server ## 快速启动后端

quick-web: install-web dev-web ## 快速启动前端

fresh: clean-all install dev ## 全新安装并启动（清理一切 + 安装 + 启动）

##@ Git 命令

git-status: ## 查看 Git 状态
	@git status

git-log: ## 查看提交日志
	@git log --oneline -10

git-clean: ## 清理未跟踪的文件（谨慎使用）
	@echo "$(RED)警告: 这将删除所有未跟踪的文件！$(NC)"
	@echo "$(YELLOW)按 Ctrl+C 取消，或按 Enter 继续...$(NC)"
	@read
	git clean -fd

##@ 模板管理

templates: ## 列出所有内置模板
	@echo "$(GREEN)内置模板列表:$(NC)"
	@echo ""
	@echo "$(BLUE)1. Spring Boot + MyBatis Plus$(NC)"
	@ls packages/server/templates/spring-mybatis-plus/
	@echo ""
	@echo "$(BLUE)2. TypeScript Frontend (React + Ant Design)$(NC)"
	@ls packages/server/templates/typescript-frontend/
	@echo ""
	@echo "$(BLUE)3. Spring Boot + JPA$(NC)"
	@ls packages/server/templates/spring-jpa/

validate-templates: ## 验证模板文件完整性
	@echo "$(GREEN)正在验证模板文件...$(NC)"
	@for dir in packages/server/templates/*/; do \
		echo "$(BLUE)检查 $$(basename $$dir)...$(NC)"; \
		find "$$dir" -name "*.njk" -type f | while read file; do \
			echo "  ✓ $$(basename $$file)"; \
		done; \
	done
	@echo "$(GREEN)验证完成$(NC)"

templates-reset: ## 仅重置内置模板（保留数据源/历史/配置）
	@echo "$(GREEN)正在重置内置模板...$(NC)"
	@curl -s -X POST http://localhost:3000/api/template/builtins/reset >/dev/null && \
		echo "$(GREEN)内置模板重置成功$(NC)" || \
		echo "$(RED)重置失败：请确保后端服务已启动（make dev-server）$(NC)"

##@ 文档命令

docs: ## 查看项目文档
	@echo "$(GREEN)项目文档:$(NC)"
	@echo ""
	@echo "$(BLUE)主要文档:$(NC)"
	@echo "  - README.md              项目说明"
	@echo "  - docs/CodeForge设计方案.md    设计方案"
	@echo "  - docs/开发进度规划.md          开发进度"
	@echo ""
	@echo "$(YELLOW)在线查看:$(NC)"
	@echo "  前端: http://localhost:5173"
	@echo "  后端 API: http://localhost:3000/api"

readme: ## 打开 README 文件
	@cat README.md

##@ 生产部署

prod-build: ## 生产环境构建
	@echo "$(GREEN)正在构建生产版本...$(NC)"
	NODE_ENV=production pnpm build

prod-start: ## 启动生产环境服务
	@echo "$(GREEN)正在启动生产环境服务...$(NC)"
	cd packages/server && NODE_ENV=production node dist/main.js

##@ 调试命令

debug-server: ## 调试模式启动后端
	@echo "$(GREEN)正在以调试模式启动后端...$(NC)"
	cd packages/server && pnpm start:debug

inspect-db: ## 查看数据库信息
	@echo "$(GREEN)数据库信息:$(NC)"
	@if [ -f packages/data/codeforge.db ]; then \
		echo "$(BLUE)文件大小:$(NC)"; \
		ls -lh packages/data/codeforge.db; \
		echo ""; \
		echo "$(BLUE)数据库表:$(NC)"; \
		echo "  - data_source      数据源配置"; \
		echo "  - template_group   模板组"; \
		echo "  - template_file    模板文件"; \
		echo "  - type_mapping     类型映射"; \
		echo "  - global_config    全局配置"; \
		echo "  - gen_history      生成历史"; \
	else \
		echo "$(RED)数据库文件不存在$(NC)"; \
	fi

logs: ## 查看最近的日志
	@echo "$(GREEN)最近的日志:$(NC)"
	@echo "$(YELLOW)提示: 日志在终端输出，请查看运行 dev 的终端$(NC)"

##@ 其他命令

version: ## 显示版本信息
	@echo "$(GREEN)CodeForge 版本信息:$(NC)"
	@echo ""
	@cat package.json | grep version | head -1
	@echo ""
	@echo "$(BLUE)依赖版本:$(NC)"
	@echo "  Node:  $$(node --version)"
	@echo "  pnpm:  $$(pnpm --version)"

info: ## 显示项目信息
	@echo "$(GREEN)CodeForge - 智能代码生成器$(NC)"
	@echo ""
	@echo "$(BLUE)项目描述:$(NC)"
	@echo "  一个基于模板的代码生成工具，支持从数据库表结构或 DDL"
	@echo "  自动生成前后端代码，内置 Spring Boot 和 TypeScript 模板。"
	@echo ""
	@echo "$(BLUE)技术栈:$(NC)"
	@echo "  后端: NestJS 10 + TypeScript + SQLite"
	@echo "  前端: React 18 + Ant Design 5 + Zustand"
	@echo "  模板引擎: Nunjucks"
	@echo ""
	@echo "$(BLUE)主要功能:$(NC)"
	@echo "  - 数据源管理（MySQL/PostgreSQL/SQLite）"
	@echo "  - 模板组管理和编辑"
	@echo "  - DDL 解析和代码生成"
	@echo "  - 类型映射配置"
	@echo "  - 国际化支持（中/英）"
