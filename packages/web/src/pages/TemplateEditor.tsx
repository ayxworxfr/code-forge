import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Space,
  List,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Popconfirm,
  Tag,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { templateApi } from '@/api';
import { useTemplateStore } from '@/stores';
import type { TemplateFile, CreateTemplateFileDto } from '@/types';
import type { MouseEvent as ReactMouseEvent } from 'react';

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const {
    currentGroup,
    currentGroupFiles,
    currentFile,
    setCurrentGroup,
    setCurrentGroupFiles,
    setCurrentFile,
  } = useTemplateStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editableFileName, setEditableFileName] = useState('');
  const [editableOutputPath, setEditableOutputPath] = useState('');

  useEffect(() => {
    if (id) {
      loadTemplateGroup(parseInt(id));
    }
  }, [id]);

  const loadTemplateGroup = async (groupId: number) => {
    setLoading(true);
    try {
      const group = await templateApi.findGroupWithFiles(groupId);
      setCurrentGroup(group);
      setCurrentGroupFiles(group.files || []);
      if (group.files && group.files.length > 0) {
        handleSelectFile(group.files[0]);
      }
    } catch (error) {
      console.error('Failed to load template group:', error);
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: TemplateFile) => {
    setCurrentFile(file);
    setEditorContent(file.content);
    setEditableFileName(file.file_name);
    setEditableOutputPath(file.output_path);
  };

  const handleSave = async () => {
    if (!currentFile) return;

    if (currentGroup?.is_builtin === 1) {
      message.error('内置模板组不可修改，请先复制后再编辑');
      return;
    }

    setSaving(true);
    try {
      const fileName = editableFileName.trim();
      const outputPath = editableOutputPath.trim();
      if (!fileName) {
        message.error('文件名不能为空');
        return;
      }
      if (!outputPath) {
        message.error('输出路径不能为空');
        return;
      }

      await templateApi.updateFile(currentFile.id, {
        file_name: fileName,
        output_path: outputPath,
        content: editorContent,
      });
      message.success(t('common.success'));

      if (id) {
        await loadTemplateGroup(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to save template file:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFile = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (currentGroup?.is_builtin === 1) {
      message.error('内置模板组不可修改');
      return;
    }

    try {
      await templateApi.removeFile(fileId);
      message.success(t('common.success'));
      if (id) {
        await loadTemplateGroup(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to delete template file:', error);
    }
  };

  const handleSubmitFile = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateTemplateFileDto = {
        group_id: parseInt(id!),
        ...values,
      };

      await templateApi.createFile(dto);
      message.success(t('common.success'));
      setModalVisible(false);

      if (id) {
        await loadTemplateGroup(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to create template file:', error);
    }
  };

  const getLanguageByFileName = (fileName: string) => {
    if (fileName.endsWith('.java.njk')) return 'java';
    if (fileName.endsWith('.xml.njk')) return 'xml';
    if (fileName.endsWith('.ts.njk')) return 'typescript';
    if (fileName.endsWith('.tsx.njk')) return 'typescript';
    if (fileName.endsWith('.py.njk')) return 'python';
    if (fileName.endsWith('.go.njk')) return 'go';
    if (fileName.endsWith('.sql.njk')) return 'sql';
    if (fileName.endsWith('.json.njk')) return 'json';
    if (fileName.endsWith('.yml.njk') || fileName.endsWith('.yaml.njk')) return 'yaml';
    if (fileName.endsWith('.md.njk')) return 'markdown';
    if (fileName.endsWith('.html.njk')) return 'html';
    if (fileName.endsWith('.css.njk')) return 'css';
    if (fileName.endsWith('.sh.njk')) return 'shell';
    if (fileName.endsWith('.properties.njk')) return 'properties';
    if (fileName.endsWith('.js.njk')) return 'javascript';
    return 'plaintext';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/template')}>
              {t('common.back')}
            </Button>
            <span>{currentGroup?.name}</span>
          </Space>
        }
        extra={
          <Space>
            {currentGroup?.is_builtin !== 1 && (
              <>
                <Button icon={<PlusOutlined />} onClick={handleCreateFile}>
                  {t('template.createFile')}
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                >
                  {t('common.save')}
                </Button>
              </>
            )}
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
          <div style={{ width: 280, overflow: 'auto', borderRight: '1px solid #f0f0f0' }}>
            <List
              size="small"
              dataSource={currentGroupFiles}
              renderItem={(file) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    backgroundColor: currentFile?.id === file.id ? '#e6f7ff' : 'transparent',
                    padding: '8px 12px',
                  }}
                  onClick={() => handleSelectFile(file)}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>{file.file_name}</span>
                    {currentGroup?.is_builtin !== 1 && (
                      <Popconfirm
                        title={t('template.deleteFileConfirm')}
                        onConfirm={(e?: ReactMouseEvent<HTMLElement>) => {
                          e?.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        onCancel={(e?: ReactMouseEvent<HTMLElement>) => e?.stopPropagation()}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </div>

          <div style={{ flex: 1 }}>
            {currentFile ? (
              <div style={{ height: '100%' }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{t('template.fileName')}:</span>
                    <Input
                      value={editableFileName}
                      onChange={(e) => setEditableFileName(e.target.value)}
                      readOnly={currentGroup?.is_builtin === 1}
                      style={{ width: 220 }}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>{t('template.outputPath')}:</span>
                    <Input
                      value={editableOutputPath}
                      onChange={(e) => setEditableOutputPath(e.target.value)}
                      readOnly={currentGroup?.is_builtin === 1}
                    />
                    <Tag>{currentFile.language}</Tag>
                  </div>
                </div>
                <Editor
                  height="calc(100% - 40px)"
                  language={getLanguageByFileName(currentFile.file_name)}
                  value={editorContent}
                  onChange={(value) => setEditorContent(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    readOnly: currentGroup?.is_builtin === 1,
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                请选择左侧文件进行编辑
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title={t('template.createFile')}
        open={modalVisible}
        onOk={handleSubmitFile}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="file_name"
            label={t('template.fileName')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="Entity.java.njk" />
          </Form.Item>

          <Form.Item
            name="output_path"
            label={t('template.outputPath')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="src/main/java/{{ global.packagePath }}/entity/{{ table.shortClassName }}.java" />
          </Form.Item>

          <Form.Item
            name="language"
            label={t('template.language')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue="java"
          >
            <Select>
              <Select.Option value="java">Java</Select.Option>
              <Select.Option value="typescript">TypeScript</Select.Option>
              <Select.Option value="python">Python</Select.Option>
              <Select.Option value="go">Go</Select.Option>
              <Select.Option value="kotlin">Kotlin</Select.Option>
              <Select.Option value="csharp">C#</Select.Option>
              <Select.Option value="javascript">JavaScript</Select.Option>
              <Select.Option value="json">JSON</Select.Option>
              <Select.Option value="yaml">YAML</Select.Option>
              <Select.Option value="markdown">Markdown</Select.Option>
              <Select.Option value="html">HTML</Select.Option>
              <Select.Option value="css">CSS</Select.Option>
              <Select.Option value="shell">Shell</Select.Option>
              <Select.Option value="properties">Properties</Select.Option>
              <Select.Option value="xml">XML</Select.Option>
              <Select.Option value="sql">SQL</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label={t('template.templateContent')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue=""
          >
            <Input.TextArea rows={10} placeholder={t('common.pleaseInput')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
