import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Input,
  Radio,
  Button,
  Table,
  Space,
  message,
  Checkbox,
  Tag,
  Modal,
  Popconfirm,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { datasourceApi, templateApi, generatorApi } from '@/api';
import { useDataSourceStore, useTemplateStore, useGeneratorStore } from '@/stores';
import type { TableInfo, TableDetail, TemplateFile } from '@/types';
import type { ColumnsType } from 'antd/es/table';

export default function GeneratorPage() {
  const { t } = useTranslation();
  const { dataSources, currentDataSource, tables, setTables, setCurrentDataSource } =
    useDataSourceStore();
  const { templateGroups } = useTemplateStore();
  const {
    selectedTables,
    selectedTemplateGroupId,
    config,
    generating,
    setSelectedTables,
    setSelectedTemplateGroupId,
    updateConfig,
    setPreviewResult,
    clearPreviewResults,
    setGenerating,
    sourceMode,
    setSourceMode,
    ddlContent,
    setDdlContent,
  } = useGeneratorStore();

  const [currentDataSourceId, setCurrentDataSourceId] = useState<number | null>(
    currentDataSource?.id ?? null,
  );
  const [loadingTables, setLoadingTables] = useState(false);
  const [currentTableDetail, setCurrentTableDetail] = useState<TableDetail | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentPreviewCode, setCurrentPreviewCode] = useState('');
  const [currentPreviewPath, setCurrentPreviewPath] = useState('');
  const [currentGroupFiles, setCurrentGroupFiles] = useState<TemplateFile[]>([]);
  const [ddlTableDetails, setDdlTableDetails] = useState<TableDetail[]>([]);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);
  const availableTableNameSet = useMemo(
    () => new Set(tables.map((table) => table.tableName)),
    [tables],
  );
  const previewSelectedTables = useMemo(
    () => selectedTables.filter((tableName) => availableTableNameSet.has(tableName)),
    [selectedTables, availableTableNameSet],
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // 从全局 store 恢复上次选择的数据源，避免切换页面后本地状态丢失
    if (!currentDataSourceId && currentDataSource?.id) {
      setCurrentDataSourceId(currentDataSource.id);
    }
  }, [currentDataSourceId, currentDataSource]);

  useEffect(() => {
    if (selectedTemplateGroupId) {
      loadTemplateFiles(selectedTemplateGroupId);
    }
  }, [selectedTemplateGroupId]);

  useEffect(() => {
    // 生成参数发生变化后，要求用户重新生成预览包，避免下载旧内容
    setGeneratedZipBlob(null);
  }, [
    sourceMode,
    currentDataSourceId,
    ddlContent,
    selectedTables,
    selectedTemplateGroupId,
    config,
  ]);

  useEffect(() => {
    // 同步已选表和当前表列表，避免表已切换但预览区域仍显示旧数据
    const validSelectedTables = selectedTables.filter((tableName) =>
      availableTableNameSet.has(tableName),
    );
    if (validSelectedTables.length !== selectedTables.length) {
      setSelectedTables(validSelectedTables);
      setCurrentTableDetail(null);
      setCurrentPreviewCode('');
      setCurrentPreviewPath('');
      clearPreviewResults();
    }
  }, [selectedTables, availableTableNameSet, setSelectedTables, clearPreviewResults]);

  const loadInitialData = async () => {
    try {
      const [groupsData, dsData] = await Promise.all([
        templateApi.findAllGroups(),
        datasourceApi.findAll(),
      ]);
      useTemplateStore.getState().setTemplateGroups(groupsData);
      useDataSourceStore.getState().setDataSources(dsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadTemplateFiles = async (groupId: number) => {
    try {
      const group = await templateApi.findGroupWithFiles(groupId);
      setCurrentGroupFiles(group.files || []);
    } catch (error) {
      console.error('Failed to load template files:', error);
    }
  };

  const handleDataSourceChange = async (dsId: number) => {
    setCurrentDataSourceId(dsId);
    const ds = dataSources.find((d) => d.id === dsId);
    setCurrentDataSource(ds || null);

    if (dsId) {
      setLoadingTables(true);
      try {
        const tableList = await datasourceApi.getTables(dsId);
        setTables(tableList);
      } catch (error) {
        console.error('Failed to load tables:', error);
      } finally {
        setLoadingTables(false);
      }
    }
  };

  const handleParseDdl = async () => {
    if (!ddlContent.trim()) {
      message.error(t('datasource.inputDdl'));
      return;
    }

    try {
      const details = await datasourceApi.parseDdl({ ddl: ddlContent });
      setDdlTableDetails(details);
      setTables(
        details.map((detail) => ({
          tableName: detail.tableName,
          tableComment: detail.tableComment,
        })),
      );
      setCurrentTableDetail(details[0] || null);
      message.success(t('generator.parseDdlSuccess', { count: details.length }));
    } catch (error) {
      console.error('Failed to parse DDL:', error);
    }
  };

  const handleTableSelect = async (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables([...selectedTables, tableName]);

      if (sourceMode === 'database' && currentDataSourceId) {
        try {
          const detail = await datasourceApi.getTableDetail(currentDataSourceId, tableName);
          setCurrentTableDetail(detail);
        } catch (error) {
          console.error('Failed to load table detail:', error);
        }
      } else if (sourceMode === 'ddl') {
        const detail = ddlTableDetails.find((table) => table.tableName === tableName) || null;
        setCurrentTableDetail(detail);
      }
    } else {
      setSelectedTables(selectedTables.filter((t) => t !== tableName));
    }
  };

  const handlePreview = async (tableName: string, templateFileId: number) => {
    if (sourceMode === 'database' && !currentDataSourceId) {
      message.error(t('datasource.selectDataSource'));
      return;
    }

    if (sourceMode === 'ddl' && !ddlContent.trim()) {
      message.error(t('datasource.inputDdl'));
      return;
    }

    try {
      const result = await generatorApi.preview({
        dataSourceId: sourceMode === 'database' ? currentDataSourceId! : undefined,
        ddl: sourceMode === 'ddl' ? ddlContent : undefined,
        tableName,
        templateFileId,
        globalConfig: config,
      });

      const key = `${tableName}_${templateFileId}`;
      setPreviewResult(key, result);

      setCurrentPreviewCode(result.code);
      setCurrentPreviewPath(result.filePath);
      setPreviewModalVisible(true);
    } catch (error) {
      console.error('Failed to preview:', error);
    }
  };

  const handleGeneratePreviewZip = async () => {
    if (!selectedTemplateGroupId) {
      message.error(t('generator.selectTemplateGroupFirst'));
      return;
    }

    if (previewSelectedTables.length === 0) {
      message.error(t('generator.selectAtLeastOneTable'));
      return;
    }

    if (sourceMode === 'database' && !currentDataSourceId) {
      message.error(t('datasource.selectDataSource'));
      return;
    }

    if (sourceMode === 'ddl' && !ddlContent.trim()) {
      message.error(t('datasource.inputDdl'));
      return;
    }

    setGenerating(true);
    try {
      const blob = await generatorApi.generateBlob({
        dataSourceId: sourceMode === 'database' ? currentDataSourceId! : undefined,
        ddl: sourceMode === 'ddl' ? ddlContent : undefined,
        tableNames: previewSelectedTables,
        templateGroupId: selectedTemplateGroupId,
        globalConfig: config,
      });
      setGeneratedZipBlob(blob);
      message.success(t('generator.previewZipReady'));
    } catch (error) {
      console.error('Failed to generate:', error);
      message.error(t('generator.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = () => {
    if (!generatedZipBlob) {
      message.warning(t('generator.pleaseGeneratePreviewZipFirst'));
      return;
    }

    const url = window.URL.createObjectURL(generatedZipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-code-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success(t('generator.downloadZipStarted'));
  };

  const handleClearCurrentSession = () => {
    setCurrentDataSourceId(null);
    setCurrentDataSource(null);
    setTables([]);
    setSelectedTables([]);
    setCurrentTableDetail(null);
    setCurrentGroupFiles([]);
    setCurrentPreviewCode('');
    setCurrentPreviewPath('');
    setPreviewModalVisible(false);
    setGeneratedZipBlob(null);
    setDdlTableDetails([]);
    clearPreviewResults();
    setDdlContent('');
    message.success(t('generator.currentOperationCleared'));
  };

  const getLanguageByFileName = (fileName: string) => {
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.xml')) return 'xml';
    if (fileName.endsWith('.ts')) return 'typescript';
    if (fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.go')) return 'go';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.sql')) return 'sql';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'yaml';
    if (fileName.endsWith('.md')) return 'markdown';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.sh')) return 'shell';
    if (fileName.endsWith('.properties')) return 'properties';
    if (fileName.endsWith('.js')) return 'javascript';
    return 'plaintext';
  };

  const tableColumns: ColumnsType<TableInfo> = [
    {
      title: t('generator.tableSelection'),
      render: (_, record) => (
        <Checkbox
          checked={selectedTables.includes(record.tableName)}
          onChange={(e) => handleTableSelect(record.tableName, e.target.checked)}
        >
          {record.tableName}
          {record.tableComment && (
            <span style={{ color: '#999', marginLeft: 8 }}>({record.tableComment})</span>
          )}
        </Checkbox>
      ),
    },
  ];

  const columnColumns: ColumnsType<any> = [
    { title: t('generator.columnName'), dataIndex: 'columnName', key: 'columnName', width: 150 },
    { title: t('generator.dataType'), dataIndex: 'columnType', key: 'columnType', width: 120 },
    {
      title: t('generator.comment'),
      dataIndex: 'columnComment',
      key: 'columnComment',
      ellipsis: true,
    },
    {
      title: t('generator.primaryKey'),
      dataIndex: 'isPrimaryKey',
      key: 'isPrimaryKey',
      width: 80,
      render: (val: boolean) => (val ? <Tag color="red">PK</Tag> : null),
    },
    {
      title: t('generator.nullable'),
      dataIndex: 'isNullable',
      key: 'isNullable',
      width: 80,
      render: (val: boolean) => (val ? <Tag>YES</Tag> : <Tag>NO</Tag>),
    },
  ];

  return (
    <div>
      <Card title={t('generator.title')} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8} xl={6}>
              <div style={{ marginBottom: 8 }}>{t('generator.selectDataSource')}</div>
              <Radio.Group
                value={sourceMode}
                onChange={(e) => setSourceMode(e.target.value)}
                style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}
              >
                <Radio value="database">{t('datasource.dbMode')}</Radio>
                <Radio value="ddl">{t('datasource.ddlMode')}</Radio>
              </Radio.Group>

              {sourceMode === 'database' ? (
                <Select
                  style={{ width: '100%' }}
                  placeholder={t('datasource.selectDataSource')}
                  value={currentDataSourceId}
                  onChange={handleDataSourceChange}
                  options={dataSources.map((ds) => ({
                    label: ds.name,
                    value: ds.id,
                  }))}
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input.TextArea
                    rows={3}
                    placeholder={t('datasource.inputDdl')}
                    value={ddlContent}
                    onChange={(e) => setDdlContent(e.target.value)}
                  />
                  <Button type="primary" onClick={handleParseDdl} block>
                    {t('datasource.parseDdl')}
                  </Button>
                </Space>
              )}
            </Col>

            <Col xs={24} lg={8} xl={5}>
              <div style={{ marginBottom: 8 }}>{t('generator.selectTemplateGroup')}</div>
              <Select
                style={{ width: '100%' }}
                placeholder={t('common.pleaseSelect')}
                value={selectedTemplateGroupId}
                onChange={setSelectedTemplateGroupId}
                options={templateGroups.map((group) => ({
                  label: group.name,
                  value: group.id,
                }))}
              />
            </Col>

            <Col xs={24} lg={24} xl={13}>
              <div style={{ marginBottom: 8 }}>{t('generator.globalConfig')}</div>
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={12} md={8} xl={4}>
                  <Input
                    placeholder={t('generator.author')}
                    value={config.author}
                    onChange={(e) => updateConfig('author', e.target.value)}
                  />
                </Col>
                <Col xs={24} sm={12} md={16} xl={11}>
                  <Input
                    placeholder={t('generator.basePackage')}
                    value={config.packageName}
                    onChange={(e) => updateConfig('packageName', e.target.value)}
                  />
                </Col>
                <Col xs={12} sm={12} md={12} xl={5}>
                  <Input
                    placeholder={t('generator.moduleName')}
                    value={config.moduleName}
                    onChange={(e) => updateConfig('moduleName', e.target.value)}
                  />
                </Col>
                <Col xs={12} sm={12} md={12} xl={4}>
                  <Input
                    placeholder={t('generator.tablePrefix')}
                    value={config.tablePrefix}
                    onChange={(e) => updateConfig('tablePrefix', e.target.value)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={10}>
          <Card
            title={t('generator.selectTables')}
            style={{ height: 'calc(100vh - 380px)', overflow: 'auto' }}
          >
            <Table
              columns={tableColumns}
              dataSource={tables}
              rowKey="tableName"
              loading={loadingTables}
              pagination={false}
              size="small"
            />

            {currentTableDetail && (
              <div style={{ marginTop: 16 }}>
                <h4>{t('generator.columnInfo')}</h4>
                <Table
                  columns={columnColumns}
                  dataSource={currentTableDetail.columns}
                  rowKey="columnName"
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col span={14}>
          <Card
            title={t('generator.codePreview')}
            extra={
              <Space>
                <Popconfirm
                  title={t('generator.clearCurrentOperationConfirmTitle')}
                  description={t('generator.clearCurrentOperationConfirmDesc')}
                  onConfirm={handleClearCurrentSession}
                >
                  <Button danger>{t('generator.clearCurrentOperation')}</Button>
                </Popconfirm>
                <Button type="primary" loading={generating} onClick={handleGeneratePreviewZip}>
                  {t('generator.generatePreviewZip')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  disabled={!generatedZipBlob}
                  onClick={handleDownloadZip}
                >
                  {t('generator.downloadZip')}
                </Button>
              </Space>
            }
            style={{ height: 'calc(100vh - 380px)', overflow: 'auto' }}
          >
            {previewSelectedTables.length > 0 && currentGroupFiles.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {previewSelectedTables.map((tableName) => (
                  <Card key={tableName} size="small" title={tableName}>
                    <Space wrap>
                      {currentGroupFiles.map((file) => (
                        <Button
                          key={file.id}
                          type="link"
                          onClick={() => handlePreview(tableName, file.id)}
                        >
                          {file.file_name}
                        </Button>
                      ))}
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                {previewSelectedTables.length === 0
                  ? t('generator.selectAtLeastOneTable')
                  : t('generator.selectTemplateGroupFirst')}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={currentPreviewPath}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width="80%"
      >
        <Editor
          height="70vh"
          language={getLanguageByFileName(currentPreviewPath)}
          value={currentPreviewCode}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </Modal>
    </div>
  );
}
