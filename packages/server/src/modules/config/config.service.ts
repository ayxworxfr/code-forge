import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface Config {
  id: number;
  config_key: string;
  config_value: string;
  description?: string;
}

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit() {
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig() {
    const defaults = [
      { key: 'defaultAuthor', value: 'admin', desc: 'Default author name' },
      { key: 'defaultPackageName', value: 'com.example.demo', desc: 'Default Java package name' },
      { key: 'defaultModuleName', value: 'system', desc: 'Default module name' },
      { key: 'defaultTablePrefix', value: 'sys_', desc: 'Default table prefix' },
      { key: 'defaultTemplateGroupId', value: '1', desc: 'Default template group ID' },
      { key: 'defaultTimezone', value: 'Asia/Shanghai', desc: 'Default timezone' },
      { key: 'defaultLocale', value: 'zh-CN', desc: 'Default language' },
      { key: 'supportedLocales', value: 'zh-CN,en-US', desc: 'Supported languages' },
    ];

    defaults.forEach(({ key, value, desc }) => {
      const existing = this.databaseService.get<Config>(
        'SELECT * FROM global_config WHERE config_key = ?',
        [key],
      );
      if (!existing) {
        this.databaseService.run(
          'INSERT INTO global_config (config_key, config_value, description) VALUES (?, ?, ?)',
          [key, value, desc],
        );
      }
    });
  }

  getAll(): Record<string, string> {
    const configs = this.databaseService.query<Config>('SELECT * FROM global_config');
    const result: Record<string, string> = {};
    configs.forEach((config) => {
      result[config.config_key] = config.config_value;
    });
    return result;
  }

  get(key: string): string | undefined {
    const config = this.databaseService.get<Config>(
      'SELECT * FROM global_config WHERE config_key = ?',
      [key],
    );
    return config?.config_value;
  }

  set(key: string, value: string): void {
    const existing = this.get(key);
    if (existing !== undefined) {
      this.databaseService.run(
        'UPDATE global_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
        [value, key],
      );
    } else {
      this.databaseService.run(
        'INSERT INTO global_config (config_key, config_value) VALUES (?, ?)',
        [key, value],
      );
    }
  }

  updateBatch(configs: Record<string, string>): void {
    Object.entries(configs).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
}
