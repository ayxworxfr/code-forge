import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getWelcome(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(this.generateWelcomePage());
  }

  private generateWelcomePage(): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeForge API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 42px; margin-bottom: 10px; }
    .header p { font-size: 18px; opacity: 0.95; }
    .content { padding: 40px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .info-card {
      background: #f7f7f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .info-card strong { display: block; color: #667eea; margin-bottom: 8px; }
    .api-section {
      margin-bottom: 30px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }
    .api-header {
      background: #f7f7f9;
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .api-header h3 { color: #333; font-size: 20px; }
    .api-header p { color: #666; font-size: 14px; margin-top: 5px; }
    .api-routes { padding: 0; }
    .api-route {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
    }
    .api-route:hover { background: #fafafa; }
    .api-route:last-child { border-bottom: none; }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      min-width: 60px;
      text-align: center;
      margin-right: 15px;
    }
    .method.get { background: #61affe; color: white; }
    .method.post { background: #49cc90; color: white; }
    .method.put { background: #fca130; color: white; }
    .method.delete { background: #f93e3e; color: white; }
    .path { font-family: 'Courier New', monospace; color: #333; flex: 1; margin-right: 15px; }
    .desc { color: #666; font-size: 14px; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 CodeForge API</h1>
      <p>本地化 Web 代码生成工具</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-card">
          <strong>版本</strong>
          <span>1.0.0</span>
        </div>
        <div class="info-card">
          <strong>状态</strong>
          <span>🟢 运行中</span>
        </div>
        <div class="info-card">
          <strong>数据库</strong>
          <span>SQLite (sql.js)</span>
        </div>
        <div class="info-card">
          <strong>启动时间</strong>
          <span>${new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <h2 style="margin-bottom: 20px; color: #333;">可用 API 端点</h2>

      ${this.renderApiSection('全局配置', 'config', '管理全局配置参数', [
        { method: 'GET', path: '/api/config', description: '获取全局配置' },
        { method: 'PUT', path: '/api/config', description: '更新全局配置' },
      ])}

      ${this.renderApiSection('数据源管理', 'datasource', '管理 MySQL 数据库连接', [
        { method: 'GET', path: '/api/datasource', description: '获取所有数据源' },
        { method: 'POST', path: '/api/datasource', description: '创建数据源' },
        { method: 'GET', path: '/api/datasource/:id', description: '获取单个数据源' },
        { method: 'PUT', path: '/api/datasource/:id', description: '更新数据源' },
        { method: 'DELETE', path: '/api/datasource/:id', description: '删除数据源' },
        { method: 'POST', path: '/api/datasource/test/:id', description: '测试数据源连接' },
        { method: 'GET', path: '/api/datasource/:id/tables', description: '获取数据库表列表' },
        { method: 'GET', path: '/api/datasource/:id/tables/:tableName', description: '获取表详情' },
        { method: 'POST', path: '/api/datasource/parse-ddl', description: '解析 DDL 语句' },
      ])}

      ${this.renderApiSection('模板管理', 'template', '管理代码生成模板', [
        { method: 'GET', path: '/api/template/groups', description: '获取所有模板组' },
        { method: 'POST', path: '/api/template/groups', description: '创建模板组' },
        { method: 'GET', path: '/api/template/groups/:id', description: '获取单个模板组' },
        { method: 'PUT', path: '/api/template/groups/:id', description: '更新模板组' },
        { method: 'DELETE', path: '/api/template/groups/:id', description: '删除模板组' },
        {
          method: 'GET',
          path: '/api/template/groups/:id/files',
          description: '获取模板组文件列表',
        },
        { method: 'POST', path: '/api/template/groups/:id/clone', description: '克隆模板组' },
        { method: 'GET', path: '/api/template/files/:id', description: '获取单个模板文件' },
        { method: 'POST', path: '/api/template/files', description: '创建模板文件' },
        { method: 'PUT', path: '/api/template/files/:id', description: '更新模板文件' },
        { method: 'DELETE', path: '/api/template/files/:id', description: '删除模板文件' },
        { method: 'PUT', path: '/api/template/files/order', description: '调整文件排序' },
      ])}

      ${this.renderApiSection('类型映射', 'type-mapping', '管理数据库类型到编程语言类型的映射', [
        { method: 'GET', path: '/api/type-mapping', description: '获取所有类型映射' },
        { method: 'POST', path: '/api/type-mapping', description: '创建类型映射' },
        { method: 'GET', path: '/api/type-mapping/:id', description: '获取单个类型映射' },
        { method: 'PUT', path: '/api/type-mapping/:id', description: '更新类型映射' },
        { method: 'DELETE', path: '/api/type-mapping/:id', description: '删除类型映射' },
        { method: 'POST', path: '/api/type-mapping/reset', description: '重置为默认映射' },
      ])}

      ${this.renderApiSection('代码生成', 'generator', '基于模板生成代码文件', [
        { method: 'POST', path: '/api/generator/preview', description: '预览生成结果' },
        { method: 'POST', path: '/api/generator/generate', description: '生成代码并下载 ZIP' },
      ])}

      ${this.renderApiSection('生成历史', 'history', '查看和管理历史生成记录', [
        { method: 'GET', path: '/api/history', description: '获取生成历史列表' },
        { method: 'DELETE', path: '/api/history/:id', description: '删除单条历史' },
        { method: 'DELETE', path: '/api/history', description: '清空所有历史' },
      ])}
    </div>

    <div class="footer">
      <p>CodeForge v1.0.0 | 运行在端口 ${process.env.PORT || 3000}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private renderApiSection(title: string, id: string, description: string, routes: any[]): string {
    return `
      <div class="api-section">
        <div class="api-header">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
        <div class="api-routes">
          ${routes
            .map(
              (route) => `
            <div class="api-route">
              <span class="method ${route.method.toLowerCase()}">${route.method}</span>
              <code class="path">${route.path}</code>
              <span class="desc">${route.description}</span>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  private getJsonWelcome() {
    return {
      name: 'CodeForge API',
      version: '1.0.0',
      description: '本地化 Web 代码生成工具',
      timestamp: new Date().toISOString(),
      endpoints: {
        config: {
          description: '全局配置管理',
          routes: [
            { method: 'GET', path: '/api/config', description: '获取全局配置' },
            { method: 'PUT', path: '/api/config', description: '更新全局配置' },
          ],
        },
        datasource: {
          description: '数据源管理',
          routes: [
            { method: 'GET', path: '/api/datasource', description: '获取所有数据源' },
            { method: 'POST', path: '/api/datasource', description: '创建数据源' },
            { method: 'GET', path: '/api/datasource/:id', description: '获取单个数据源' },
            { method: 'PUT', path: '/api/datasource/:id', description: '更新数据源' },
            { method: 'DELETE', path: '/api/datasource/:id', description: '删除数据源' },
            { method: 'POST', path: '/api/datasource/test/:id', description: '测试数据源连接' },
            { method: 'GET', path: '/api/datasource/:id/tables', description: '获取数据库表列表' },
            {
              method: 'GET',
              path: '/api/datasource/:id/tables/:tableName',
              description: '获取表详情',
            },
            { method: 'POST', path: '/api/datasource/parse-ddl', description: '解析 DDL 语句' },
          ],
        },
        template: {
          description: '模板管理',
          routes: [
            { method: 'GET', path: '/api/template/groups', description: '获取所有模板组' },
            { method: 'POST', path: '/api/template/groups', description: '创建模板组' },
            { method: 'GET', path: '/api/template/groups/:id', description: '获取单个模板组' },
            { method: 'PUT', path: '/api/template/groups/:id', description: '更新模板组' },
            { method: 'DELETE', path: '/api/template/groups/:id', description: '删除模板组' },
            {
              method: 'GET',
              path: '/api/template/groups/:id/files',
              description: '获取模板组文件列表',
            },
            { method: 'POST', path: '/api/template/groups/:id/clone', description: '克隆模板组' },
            { method: 'GET', path: '/api/template/files/:id', description: '获取单个模板文件' },
            { method: 'POST', path: '/api/template/files', description: '创建模板文件' },
            { method: 'PUT', path: '/api/template/files/:id', description: '更新模板文件' },
            { method: 'DELETE', path: '/api/template/files/:id', description: '删除模板文件' },
            { method: 'PUT', path: '/api/template/files/order', description: '调整文件排序' },
          ],
        },
        typeMapping: {
          description: '类型映射管理',
          routes: [
            { method: 'GET', path: '/api/type-mapping', description: '获取所有类型映射' },
            { method: 'POST', path: '/api/type-mapping', description: '创建类型映射' },
            { method: 'GET', path: '/api/type-mapping/:id', description: '获取单个类型映射' },
            { method: 'PUT', path: '/api/type-mapping/:id', description: '更新类型映射' },
            { method: 'DELETE', path: '/api/type-mapping/:id', description: '删除类型映射' },
            { method: 'POST', path: '/api/type-mapping/reset', description: '重置为默认映射' },
          ],
        },
        generator: {
          description: '代码生成',
          routes: [
            { method: 'POST', path: '/api/generator/preview', description: '预览生成结果' },
            { method: 'POST', path: '/api/generator/generate', description: '生成代码并下载' },
          ],
        },
        history: {
          description: '生成历史',
          routes: [
            { method: 'GET', path: '/api/history', description: '获取生成历史列表' },
            { method: 'DELETE', path: '/api/history/:id', description: '删除单条历史' },
            { method: 'DELETE', path: '/api/history', description: '清空所有历史' },
          ],
        },
      },
    };
  }
}
