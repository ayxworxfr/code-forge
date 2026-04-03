import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTypeMappingDto } from './dto/create-type-mapping.dto';
import { UpdateTypeMappingDto } from './dto/update-type-mapping.dto';
import { TypeMapping } from './entities/type-mapping.entity';

@Injectable()
export class TypeMappingService {
  private initialized = false;

  constructor(private readonly databaseService: DatabaseService) {}

  private ensureInitialized() {
    if (this.initialized) return;
    this.initializeDefaultMappings();
    this.initialized = true;
  }

  private initializeDefaultMappings() {
    const defaultMappings = [
      { source_type: 'tinyint', java_type: 'Integer', ts_type: 'number', jdbc_type: 'TINYINT' },
      { source_type: 'smallint', java_type: 'Integer', ts_type: 'number', jdbc_type: 'SMALLINT' },
      { source_type: 'mediumint', java_type: 'Integer', ts_type: 'number', jdbc_type: 'INTEGER' },
      { source_type: 'int', java_type: 'Integer', ts_type: 'number', jdbc_type: 'INTEGER' },
      { source_type: 'integer', java_type: 'Integer', ts_type: 'number', jdbc_type: 'INTEGER' },
      { source_type: 'bigint', java_type: 'Long', ts_type: 'number', jdbc_type: 'BIGINT' },
      { source_type: 'float', java_type: 'Float', ts_type: 'number', jdbc_type: 'FLOAT' },
      { source_type: 'double', java_type: 'Double', ts_type: 'number', jdbc_type: 'DOUBLE' },
      { source_type: 'decimal', java_type: 'BigDecimal', ts_type: 'number', jdbc_type: 'DECIMAL' },
      { source_type: 'char', java_type: 'String', ts_type: 'string', jdbc_type: 'CHAR' },
      { source_type: 'varchar', java_type: 'String', ts_type: 'string', jdbc_type: 'VARCHAR' },
      { source_type: 'text', java_type: 'String', ts_type: 'string', jdbc_type: 'LONGVARCHAR' },
      { source_type: 'tinytext', java_type: 'String', ts_type: 'string', jdbc_type: 'VARCHAR' },
      {
        source_type: 'mediumtext',
        java_type: 'String',
        ts_type: 'string',
        jdbc_type: 'LONGVARCHAR',
      },
      { source_type: 'longtext', java_type: 'String', ts_type: 'string', jdbc_type: 'LONGVARCHAR' },
      { source_type: 'date', java_type: 'LocalDate', ts_type: 'string', jdbc_type: 'DATE' },
      { source_type: 'time', java_type: 'LocalTime', ts_type: 'string', jdbc_type: 'TIME' },
      {
        source_type: 'datetime',
        java_type: 'LocalDateTime',
        ts_type: 'string',
        jdbc_type: 'TIMESTAMP',
      },
      {
        source_type: 'timestamp',
        java_type: 'LocalDateTime',
        ts_type: 'string',
        jdbc_type: 'TIMESTAMP',
      },
      { source_type: 'year', java_type: 'Integer', ts_type: 'number', jdbc_type: 'INTEGER' },
      { source_type: 'binary', java_type: 'byte[]', ts_type: 'string', jdbc_type: 'BINARY' },
      { source_type: 'varbinary', java_type: 'byte[]', ts_type: 'string', jdbc_type: 'VARBINARY' },
      { source_type: 'blob', java_type: 'byte[]', ts_type: 'string', jdbc_type: 'BLOB' },
      { source_type: 'json', java_type: 'String', ts_type: 'any', jdbc_type: 'VARCHAR' },
    ];

    defaultMappings.forEach((mapping) => {
      const existing = this.databaseService.get<TypeMapping>(
        'SELECT * FROM type_mapping WHERE source_type = ?',
        [mapping.source_type],
      );

      if (!existing) {
        this.databaseService.run(
          'INSERT INTO type_mapping (source_type, java_type, ts_type, jdbc_type, is_builtin) VALUES (?, ?, ?, ?, 1)',
          [mapping.source_type, mapping.java_type, mapping.ts_type, mapping.jdbc_type],
        );
      }
    });
  }

  findAll(): TypeMapping[] {
    this.ensureInitialized();
    return this.databaseService.query<TypeMapping>(
      'SELECT * FROM type_mapping ORDER BY is_builtin DESC, source_type ASC',
    );
  }

  findOne(id: number): TypeMapping {
    const mapping = this.databaseService.get<TypeMapping>(
      'SELECT * FROM type_mapping WHERE id = ?',
      [id],
    );
    if (!mapping) {
      throw new NotFoundException(`Type mapping with ID ${id} not found`);
    }
    return mapping;
  }

  findBySourceType(sourceType: string): TypeMapping | undefined {
    return this.databaseService.get<TypeMapping>(
      'SELECT * FROM type_mapping WHERE source_type = ?',
      [sourceType.toLowerCase()],
    );
  }

  create(dto: CreateTypeMappingDto): TypeMapping {
    const existing = this.findBySourceType(dto.source_type);
    if (existing) {
      throw new BadRequestException(`Type mapping for ${dto.source_type} already exists`);
    }

    const result = this.databaseService.run(
      'INSERT INTO type_mapping (source_type, java_type, ts_type, jdbc_type, is_builtin) VALUES (?, ?, ?, ?, 0)',
      [dto.source_type.toLowerCase(), dto.java_type, dto.ts_type, dto.jdbc_type],
    );
    return this.findOne(result.lastInsertRowid as number);
  }

  update(id: number, dto: UpdateTypeMappingDto): TypeMapping {
    const existing = this.findOne(id);

    if (existing.is_builtin === 1) {
      throw new BadRequestException('Cannot modify built-in type mapping');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.source_type !== undefined) {
      const duplicate = this.findBySourceType(dto.source_type);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`Type mapping for ${dto.source_type} already exists`);
      }
      updates.push('source_type = ?');
      params.push(dto.source_type.toLowerCase());
    }
    if (dto.java_type !== undefined) {
      updates.push('java_type = ?');
      params.push(dto.java_type);
    }
    if (dto.ts_type !== undefined) {
      updates.push('ts_type = ?');
      params.push(dto.ts_type);
    }
    if (dto.jdbc_type !== undefined) {
      updates.push('jdbc_type = ?');
      params.push(dto.jdbc_type);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      const sql = 'UPDATE type_mapping SET ' + updates.join(', ') + ' WHERE id = ?';
      this.databaseService.run(sql, params);
    }

    return this.findOne(id);
  }

  remove(id: number): void {
    const existing = this.findOne(id);

    if (existing.is_builtin === 1) {
      throw new BadRequestException('Cannot delete built-in type mapping');
    }

    this.databaseService.run('DELETE FROM type_mapping WHERE id = ?', [id]);
  }

  resetToDefault(): void {
    this.databaseService.run('DELETE FROM type_mapping WHERE is_builtin = 0');
    this.databaseService.run('DELETE FROM type_mapping WHERE is_builtin = 1');
    this.initializeDefaultMappings();
  }
}
