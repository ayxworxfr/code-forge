import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTemplateGroupDto } from './dto/create-template-group.dto';
import { UpdateTemplateGroupDto } from './dto/update-template-group.dto';
import { CreateTemplateFileDto } from './dto/create-template-file.dto';
import { UpdateTemplateFileDto } from './dto/update-template-file.dto';
import { TemplateGroup, TemplateFile, TemplateGroupWithFiles } from './entities/template.entity';
import { join } from 'path';
import { readFileSync } from 'fs';
import JSZip from 'jszip';

interface ImportZipManifestFile {
  file_name: string;
  output_path: string;
  language?: string;
  enabled?: number;
  sort_order?: number;
  path?: string;
}

interface ParsedImportZip {
  manifest: {
    group: {
      name: string;
      description?: string;
      tags?: string[];
    };
    files: ImportZipManifestFile[];
  };
  zip: JSZip;
}

@Injectable()
export class TemplateService {
  constructor(private readonly databaseService: DatabaseService) {}

  async exportGroupZip(id: number): Promise<{ fileName: string; buffer: Buffer }> {
    const group = this.findGroupWithFiles(id);
    const zip = new JSZip();
    const safeGroupName = group.name.replace(/[\\/:*?"<>|]+/g, '_');

    zip.file(
      'manifest.json',
      JSON.stringify(
        {
          group: {
            name: group.name,
            description: group.description || '',
            tags: Array.isArray(group.tags) ? group.tags : [],
          },
          files: group.files.map((file) => ({
            file_name: file.file_name,
            output_path: file.output_path,
            language: file.language || '',
            enabled: file.enabled,
            sort_order: file.sort_order,
            path: `templates/${file.file_name}`,
          })),
        },
        null,
        2,
      ),
    );

    group.files.forEach((file) => {
      zip.file(`templates/${file.file_name}`, file.content);
    });

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    return {
      fileName: `${safeGroupName}.zip`,
      buffer,
    };
  }

  async previewImportZip(fileBuffer: Buffer): Promise<{
    groupName: string;
    fileCount: number;
    hasDuplicateGroupName: boolean;
    hasDuplicateFileNames: boolean;
  }> {
    const parsed = await this.parseImportZip(fileBuffer);
    const groupName = parsed.manifest.group.name.trim();
    const fileNames = parsed.manifest.files.map((file) => file.file_name);
    const hasDuplicateFileNames = new Set(fileNames).size !== fileNames.length;
    const existing = this.databaseService.get<{ id: number }>(
      'SELECT id FROM template_group WHERE name = ?',
      [groupName],
    );
    return {
      groupName,
      fileCount: parsed.manifest.files.length,
      hasDuplicateGroupName: !!existing,
      hasDuplicateFileNames,
    };
  }

  async importGroupZip(
    fileBuffer: Buffer,
    overrideGroupName?: string,
  ): Promise<TemplateGroupWithFiles> {
    const parsed = await this.parseImportZip(fileBuffer);
    const targetGroupName = (overrideGroupName || parsed.manifest.group.name || '').trim();
    if (!targetGroupName) {
      throw new BadRequestException('Invalid zip: group.name is required');
    }

    const duplicate = this.databaseService.get<{ id: number }>(
      'SELECT id FROM template_group WHERE name = ?',
      [targetGroupName],
    );
    if (duplicate) {
      throw new BadRequestException(`Template group name already exists: ${targetGroupName}`);
    }

    const preparedFiles = await Promise.all(
      parsed.manifest.files.map(async (fileMeta, index) => {
        const fileName = String(fileMeta.file_name || '').trim();
        const outputPath = String(fileMeta.output_path || '').trim();
        const entryPath = String(fileMeta.path || `templates/${fileName}`);
        const entry = parsed.zip.file(entryPath);
        if (!entry) {
          throw new BadRequestException(`Invalid zip: file entry not found (${entryPath})`);
        }
        const content = await entry.async('string');
        return {
          fileName,
          outputPath,
          content,
          language: String(fileMeta.language || ''),
          enabled: fileMeta.enabled !== 0,
          sortOrder: Number.isFinite(fileMeta.sort_order) ? fileMeta.sort_order : index + 1,
        };
      }),
    );

    let createdGroupId = 0;
    this.databaseService.transaction(() => {
      const newGroup = this.createGroup({
        name: targetGroupName,
        description: parsed.manifest.group.description || '',
        tags: Array.isArray(parsed.manifest.group.tags) ? parsed.manifest.group.tags : [],
      });
      createdGroupId = newGroup.id;

      preparedFiles.forEach((file) => {
        this.createFile({
          group_id: newGroup.id,
          file_name: file.fileName,
          output_path: file.outputPath,
          content: file.content,
          language: file.language,
          enabled: file.enabled,
          sort_order: file.sortOrder,
        });
      });
    });

    return this.findGroupWithFiles(createdGroupId);
  }

  private async parseImportZip(fileBuffer: Buffer): Promise<ParsedImportZip> {
    const zip = await JSZip.loadAsync(fileBuffer);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      throw new BadRequestException('Invalid zip: missing manifest.json');
    }

    let manifest: any;
    try {
      manifest = JSON.parse(await manifestFile.async('string'));
    } catch {
      throw new BadRequestException('Invalid zip: manifest.json is not valid JSON');
    }

    const groupName = manifest?.group?.name?.trim();
    if (!groupName) {
      throw new BadRequestException('Invalid zip: group.name is required');
    }

    if (!Array.isArray(manifest?.files) || manifest.files.length === 0) {
      throw new BadRequestException('Invalid zip: files is required');
    }
    manifest.files.forEach((fileMeta: ImportZipManifestFile) => {
      const fileName = String(fileMeta.file_name || '').trim();
      const outputPath = String(fileMeta.output_path || '').trim();
      if (!fileName || !outputPath) {
        throw new BadRequestException('Invalid zip: file_name and output_path are required');
      }
    });

    return { manifest, zip };
  }

  /**
   * 重置内置模板（保留用户数据）
   */
  resetBuiltins(): { message: string } {
    this.databaseService.transaction(() => {
      this.databaseService.run('DELETE FROM template_group WHERE is_builtin = 1');
      this.insertSpringMyBatisPlusTemplates();
      this.insertTypeScriptFrontendTemplates();
      this.insertSpringJpaTemplates();
      this.insertGoGinGormTemplates();
    });
    return { message: 'Built-in templates reset successfully' };
  }

  private insertBuiltinTemplateGroup(
    group: { name: string; description: string; tags: string[] },
    templatesDir: string,
    templates: { fileName: string; outputPath: string; language: string; order: number }[],
  ) {
    const groupResult = this.databaseService.run(
      `INSERT INTO template_group (name, description, is_builtin, tags) 
       VALUES (?, ?, ?, ?)`,
      [group.name, group.description, 1, JSON.stringify(group.tags)],
    );

    const groupId = groupResult.lastInsertRowid;
    templates.forEach((template) => {
      const filePath = join(templatesDir, template.fileName);
      const content = readFileSync(filePath, 'utf-8');
      this.databaseService.run(
        `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          template.fileName,
          template.outputPath,
          content,
          template.language,
          1,
          template.order,
        ],
      );
    });
  }

  private insertSpringMyBatisPlusTemplates() {
    this.insertBuiltinTemplateGroup(
      {
        name: 'Spring Boot + MyBatis Plus',
        description: 'Spring Boot 项目代码生成模板（使用 MyBatis Plus）',
        tags: ['Java', 'Spring Boot', 'MyBatis Plus', 'Backend'],
      },
      join(__dirname, '../../templates/spring-mybatis-plus'),
      [
        {
          fileName: 'Entity.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/entity/{{ table.shortClassName }}.java',
          language: 'java',
          order: 1,
        },
        {
          fileName: 'Mapper.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/mapper/{{ table.shortClassName }}Mapper.java',
          language: 'java',
          order: 2,
        },
        {
          fileName: 'Mapper.xml.njk',
          outputPath: 'src/main/resources/mapper/{{ table.shortClassName }}Mapper.xml',
          language: 'xml',
          order: 3,
        },
        {
          fileName: 'Service.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/service/{{ table.shortClassName }}Service.java',
          language: 'java',
          order: 4,
        },
        {
          fileName: 'ServiceImpl.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/service/impl/{{ table.shortClassName }}ServiceImpl.java',
          language: 'java',
          order: 5,
        },
        {
          fileName: 'Controller.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/controller/{{ table.shortClassName }}Controller.java',
          language: 'java',
          order: 6,
        },
      ],
    );
  }

  private insertTypeScriptFrontendTemplates() {
    this.insertBuiltinTemplateGroup(
      {
        name: 'TypeScript Frontend',
        description: 'TypeScript 前端代码生成模板（React + Ant Design）',
        tags: ['TypeScript', 'React', 'Ant Design', 'Frontend'],
      },
      join(__dirname, '../../templates/typescript-frontend'),
      [
        {
          fileName: 'types.ts.njk',
          outputPath: 'src/types/{{ table.shortCamelName }}.ts',
          language: 'typescript',
          order: 1,
        },
        {
          fileName: 'api.ts.njk',
          outputPath: 'src/api/{{ table.shortCamelName }}.ts',
          language: 'typescript',
          order: 2,
        },
        {
          fileName: 'components.tsx.njk',
          outputPath: 'src/components/{{ table.shortClassName }}Manager.tsx',
          language: 'typescript',
          order: 3,
        },
      ],
    );
  }

  private insertSpringJpaTemplates() {
    this.insertBuiltinTemplateGroup(
      {
        name: 'Spring Boot + JPA',
        description: 'Spring Boot 项目代码生成模板（使用 Spring Data JPA）',
        tags: ['Java', 'Spring Boot', 'JPA', 'Backend'],
      },
      join(__dirname, '../../templates/spring-jpa'),
      [
        {
          fileName: 'Entity.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/entity/{{ table.shortClassName }}.java',
          language: 'java',
          order: 1,
        },
        {
          fileName: 'Repository.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/repository/{{ table.shortClassName }}Repository.java',
          language: 'java',
          order: 2,
        },
        {
          fileName: 'Service.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/service/{{ table.shortClassName }}Service.java',
          language: 'java',
          order: 3,
        },
        {
          fileName: 'ServiceImpl.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/service/impl/{{ table.shortClassName }}ServiceImpl.java',
          language: 'java',
          order: 4,
        },
        {
          fileName: 'Controller.java.njk',
          outputPath:
            'src/main/java/{{ global.packagePath }}/controller/{{ table.shortClassName }}Controller.java',
          language: 'java',
          order: 5,
        },
      ],
    );
  }

  private insertGoGinGormTemplates() {
    this.insertBuiltinTemplateGroup(
      {
        name: 'Go + Gin + GORM (DDD)',
        description: 'Go 项目代码生成模板（Gin + GORM，DDD/整洁架构）',
        tags: ['Go', 'Gin', 'GORM', 'DDD', 'Backend'],
      },
      join(__dirname, '../../templates/go-gin-gorm'),
      [
        {
          fileName: 'model.go.njk',
          outputPath:
            'internal/domain/{{ global.moduleName }}/entity/{{ table.shortCamelName }}.go',
          language: 'go',
          order: 1,
        },
        {
          fileName: 'dto.go.njk',
          outputPath:
            'internal/application/{{ global.moduleName }}/dto/{{ table.shortCamelName }}_dto.go',
          language: 'go',
          order: 2,
        },
        {
          fileName: 'repository.go.njk',
          outputPath:
            'internal/infrastructure/persistence/{{ global.moduleName }}/{{ table.shortCamelName }}_repository.go',
          language: 'go',
          order: 3,
        },
        {
          fileName: 'service.go.njk',
          outputPath:
            'internal/application/{{ global.moduleName }}/service/{{ table.shortCamelName }}_service.go',
          language: 'go',
          order: 4,
        },
        {
          fileName: 'handler.go.njk',
          outputPath:
            'internal/interfaces/http/{{ global.moduleName }}/{{ table.shortCamelName }}_handler.go',
          language: 'go',
          order: 5,
        },
        {
          fileName: 'router.go.njk',
          outputPath:
            'internal/interfaces/http/{{ global.moduleName }}/{{ table.shortCamelName }}_router.go',
          language: 'go',
          order: 6,
        },
      ],
    );
  }

  // ==================== 模板组管理 ====================

  /**
   * 查询所有模板组
   */
  findAllGroups(): TemplateGroup[] {
    const groups = this.databaseService.query<TemplateGroup>(
      'SELECT * FROM template_group ORDER BY is_builtin DESC, created_at DESC',
    );
    return groups.map((group) => ({
      ...group,
      tags: group.tags ? JSON.parse(group.tags) : [],
    }));
  }

  /**
   * 根据ID查询模板组
   */
  findOneGroup(id: number): TemplateGroup {
    const group = this.databaseService.get<TemplateGroup>(
      'SELECT * FROM template_group WHERE id = ?',
      [id],
    );
    if (!group) {
      throw new NotFoundException(`Template group with ID ${id} not found`);
    }
    return {
      ...group,
      tags: group.tags ? JSON.parse(group.tags) : [],
    };
  }

  /**
   * 查询模板组及其所有文件
   */
  findGroupWithFiles(id: number): TemplateGroupWithFiles {
    const group = this.findOneGroup(id);
    const files = this.findFilesByGroupId(id);
    return {
      ...group,
      files,
    };
  }

  /**
   * 创建模板组
   */
  createGroup(dto: CreateTemplateGroupDto): TemplateGroup {
    const tags = dto.tags ? JSON.stringify(dto.tags) : null;
    const result = this.databaseService.run(
      `INSERT INTO template_group (name, description, tags, is_builtin)
       VALUES (?, ?, ?, 0)`,
      [dto.name, dto.description || '', tags],
    );
    return this.findOneGroup(result.lastInsertRowid as number);
  }

  /**
   * 更新模板组
   */
  updateGroup(id: number, dto: UpdateTemplateGroupDto): TemplateGroup {
    const existing = this.findOneGroup(id);

    if (existing.is_builtin === 1) {
      throw new BadRequestException('Cannot modify built-in template group');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push('description = ?');
      params.push(dto.description);
    }
    if (dto.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(dto.tags));
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      const sql = `UPDATE template_group SET ` + updates.join(', ') + ` WHERE id = ?`;
      this.databaseService.run(sql, params);
    }

    return this.findOneGroup(id);
  }

  /**
   * 删除模板组（级联删除所有文件）
   */
  removeGroup(id: number): void {
    const existing = this.findOneGroup(id);

    if (existing.is_builtin === 1) {
      throw new BadRequestException('Cannot delete built-in template group');
    }

    this.databaseService.run('DELETE FROM template_group WHERE id = ?', [id]);
  }

  /**
   * 克隆模板组
   */
  cloneGroup(id: number, newName: string): TemplateGroupWithFiles {
    const source = this.findGroupWithFiles(id);

    const newGroup = this.createGroup({
      name: newName,
      description: `Cloned from ` + source.name,
      tags: Array.isArray(source.tags) ? source.tags : [],
    });

    source.files.forEach((file) => {
      this.createFile({
        group_id: newGroup.id,
        file_name: file.file_name,
        output_path: file.output_path,
        content: file.content,
        language: file.language,
        enabled: file.enabled === 1,
        sort_order: file.sort_order,
      });
    });

    return this.findGroupWithFiles(newGroup.id);
  }

  // ==================== 模板文件管理 ====================

  /**
   * 查询指定组的所有文件
   */
  findFilesByGroupId(groupId: number): TemplateFile[] {
    return this.databaseService.query<TemplateFile>(
      'SELECT * FROM template_file WHERE group_id = ? ORDER BY sort_order ASC, created_at ASC',
      [groupId],
    );
  }

  /**
   * 根据ID查询模板文件
   */
  findOneFile(id: number): TemplateFile {
    const file = this.databaseService.get<TemplateFile>(
      'SELECT * FROM template_file WHERE id = ?',
      [id],
    );
    if (!file) {
      throw new NotFoundException(`Template file with ID ${id} not found`);
    }
    return file;
  }

  /**
   * 创建模板文件
   */
  createFile(dto: CreateTemplateFileDto): TemplateFile {
    this.findOneGroup(dto.group_id);

    const result = this.databaseService.run(
      `INSERT INTO template_file (group_id, file_name, output_path, content, language, enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.group_id,
        dto.file_name,
        dto.output_path,
        dto.content,
        dto.language || '',
        dto.enabled === false ? 0 : 1,
        dto.sort_order || 0,
      ],
    );
    return this.findOneFile(result.lastInsertRowid as number);
  }

  /**
   * 更新模板文件
   */
  updateFile(id: number, dto: UpdateTemplateFileDto): TemplateFile {
    const existing = this.findOneFile(id);

    const group = this.findOneGroup(existing.group_id);
    if (group.is_builtin === 1) {
      throw new BadRequestException('Cannot modify files in built-in template group');
    }

    if (dto.group_id !== undefined) {
      this.findOneGroup(dto.group_id);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.group_id !== undefined) {
      updates.push('group_id = ?');
      params.push(dto.group_id);
    }
    if (dto.file_name !== undefined) {
      updates.push('file_name = ?');
      params.push(dto.file_name);
    }
    if (dto.output_path !== undefined) {
      updates.push('output_path = ?');
      params.push(dto.output_path);
    }
    if (dto.content !== undefined) {
      updates.push('content = ?');
      params.push(dto.content);
    }
    if (dto.language !== undefined) {
      updates.push('language = ?');
      params.push(dto.language);
    }
    if (dto.enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(dto.enabled ? 1 : 0);
    }
    if (dto.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(dto.sort_order);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      const sql = `UPDATE template_file SET ` + updates.join(', ') + ` WHERE id = ?`;
      this.databaseService.run(sql, params);
    }

    return this.findOneFile(id);
  }

  /**
   * 删除模板文件
   */
  removeFile(id: number): void {
    const existing = this.findOneFile(id);

    const group = this.findOneGroup(existing.group_id);
    if (group.is_builtin === 1) {
      throw new BadRequestException('Cannot delete files from built-in template group');
    }

    this.databaseService.run('DELETE FROM template_file WHERE id = ?', [id]);
  }

  /**
   * 批量更新模板文件排序
   */
  updateFilesOrder(fileOrders: { id: number; sort_order: number }[]): void {
    this.databaseService.transaction(() => {
      fileOrders.forEach(({ id, sort_order }) => {
        this.databaseService.run(
          'UPDATE template_file SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [sort_order, id],
        );
      });
    });
  }
}
