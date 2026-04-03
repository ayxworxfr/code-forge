import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface GenHistory {
  id: number;
  datasource_id?: number;
  datasource_name?: string;
  table_names: string;
  template_group_id?: number;
  template_group_name?: string;
  config_snapshot?: string;
  file_count: number;
  created_at: string;
}

@Injectable()
export class HistoryService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(limit: number = 100): GenHistory[] {
    return this.databaseService.query<GenHistory>(
      'SELECT * FROM gen_history ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
  }

  create(data: {
    datasource_id?: number;
    datasource_name?: string;
    table_names: string[];
    template_group_id?: number;
    template_group_name?: string;
    config_snapshot?: any;
    file_count: number;
  }): GenHistory {
    const result = this.databaseService.run(
      `INSERT INTO gen_history (datasource_id, datasource_name, table_names, template_group_id, template_group_name, config_snapshot, file_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.datasource_id || null,
        data.datasource_name || '',
        JSON.stringify(data.table_names),
        data.template_group_id || null,
        data.template_group_name || '',
        JSON.stringify(data.config_snapshot || {}),
        data.file_count,
      ],
    );
    const id = result.lastInsertRowid as number;
    return this.databaseService.get<GenHistory>('SELECT * FROM gen_history WHERE id = ?', [id]);
  }

  remove(id: number): void {
    this.databaseService.run('DELETE FROM gen_history WHERE id = ?', [id]);
  }

  clear(): void {
    this.databaseService.run('DELETE FROM gen_history');
  }
}
