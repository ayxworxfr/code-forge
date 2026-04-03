# I18n 模块说明

## 当前状态

⚠️ **此模块暂未实现**

根据项目开发优先级，国际化（I18n）模块被规划为 **P5 阶段**的可选功能，目前暂时跳过。

## 为什么暂不实现？

1. **优先核心功能**: 代码生成器的核心功能（数据源、模板、生成器）更重要
2. **开发效率**: 中文硬编码可以更快完成开发和测试
3. **用户群体**: 本地工具，主要面向中文用户
4. **可扩展性**: 架构已预留扩展空间，后续可随时添加

## 当前的国际化支持

虽然没有独立的 I18n 模块，但系统已经为国际化做了以下准备：

### 1. 数据库配置
`global_config` 表中预留了语言配置：
- `defaultLocale`: 默认语言（zh-CN）
- `supportedLocales`: 支持的语言列表（zh-CN,en-US）

### 2. 错误消息
所有错误消息目前直接写在代码中：
```typescript
throw new NotFoundException('数据源未找到');
```

### 3. 响应格式
统一的响应格式支持消息字段：
```json
{
  "code": 0,
  "message": "success",
  "data": {...}
}
```

## 如果需要实现 I18n

### 后端实现方案

#### 1. 创建语言包文件
```
packages/server/src/modules/i18n/
├── locales/
│   ├── zh-CN.json
│   └── en-US.json
├── i18n.service.ts
├── i18n.controller.ts
└── i18n.module.ts
```

#### 2. 语言包示例
```json
// locales/zh-CN.json
{
  "common": {
    "success": "操作成功",
    "failed": "操作失败"
  },
  "datasource": {
    "notFound": "数据源未找到",
    "connectionSuccess": "连接成功",
    "connectionFailed": "连接失败：{message}"
  }
}
```

#### 3. I18nService
```typescript
@Injectable()
export class I18nService {
  private messages: Record<string, any> = {};

  constructor(private configService: ConfigService) {
    this.loadMessages();
  }

  t(key: string, params?: Record<string, any>): string {
    const locale = this.configService.get('defaultLocale') || 'zh-CN';
    const message = this.getMessage(locale, key);
    return this.interpolate(message, params);
  }

  private getMessage(locale: string, key: string): string {
    // 实现消息查找逻辑
  }

  private interpolate(message: string, params?: Record<string, any>): string {
    // 实现参数插值
  }
}
```

#### 4. 使用方式
```typescript
// 修改现有代码
throw new NotFoundException(
  this.i18n.t('datasource.notFound')
);
```

### 前端实现方案

使用 `react-i18next`：

```typescript
// src/locales/zh-CN.json
{
  "datasource": {
    "title": "数据源管理",
    "addButton": "新增数据源"
  }
}

// 组件中使用
import { useTranslation } from 'react-i18next';

function DataSourcePage() {
  const { t } = useTranslation();
  return <h1>{t('datasource.title')}</h1>;
}
```

## 决策建议

### 短期（当前阶段）
✅ **不实现 I18n**
- 继续使用中文硬编码
- 专注前端开发和内置模板

### 中期（前端完成后）
⚠️ **评估需求**
- 如果只有中文用户，保持现状
- 如果需要英文支持，再补充 I18n

### 长期（产品化阶段）
✅ **实现完整 I18n**
- 后端 + 前端完整国际化
- 支持多语言切换
- 错误消息本地化

## 总结

当前 `i18n/` 目录为空是**合理且有意为之**的，不影响项目核心功能开发。如果后续有国际化需求，可以按照上述方案快速补充。
