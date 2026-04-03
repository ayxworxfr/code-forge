import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Dropdown,
  List,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Tooltip,
  message,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { templateApi } from '@/api';
import { useTemplateStore } from '@/stores';
import type { TemplateGroup, CreateTemplateGroupDto } from '@/types';
import type { MenuProps } from 'antd';

export default function TemplatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const {
    templateGroups,
    setTemplateGroups,
    addTemplateGroup,
    updateTemplateGroup,
    removeTemplateGroup,
  } = useTemplateStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadTemplateGroups();
  }, []);

  const loadTemplateGroups = async () => {
    setLoading(true);
    try {
      const data = await templateApi.findAllGroups();
      setTemplateGroups(data);
    } catch (error) {
      console.error('Failed to load template groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record: TemplateGroup) => {
    const tags = record.tags
      ? typeof record.tags === 'string'
        ? JSON.parse(record.tags)
        : record.tags
      : [];
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      tags: Array.isArray(tags) ? tags.join(', ') : '',
    });
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await templateApi.removeGroup(id);
      removeTemplateGroup(id);
      message.success(t('common.success'));
    } catch (error) {
      console.error('Failed to delete template group:', error);
    }
  };

  const handleDeleteConfirm = (id: number) => {
    Modal.confirm({
      title: t('template.deleteGroupConfirm'),
      okButtonProps: { danger: true },
      onOk: () => handleDelete(id),
    });
  };

  const handleClone = async (id: number) => {
    Modal.confirm({
      title: t('template.cloneGroup'),
      content: (
        <Input
          id="cloneName"
          placeholder={t('template.groupName')}
          defaultValue={`${templateGroups.find((g) => g.id === id)?.name} - 副本`}
        />
      ),
      onOk: async () => {
        const input = document.getElementById('cloneName') as HTMLInputElement;
        const name = input?.value;
        if (!name) {
          message.error(t('common.required'));
          return;
        }
        try {
          const cloned = await templateApi.cloneGroup(id, name);
          addTemplateGroup(cloned);
          message.success(t('common.success'));
        } catch (error) {
          console.error('Failed to clone template group:', error);
        }
      },
    });
  };

  const handleEditFiles = (id: number) => {
    navigate(`/template/${id}/edit`);
  };

  const handleExportZip = async (id: number) => {
    try {
      await templateApi.exportGroupZip(id);
      message.success(t('common.success'));
    } catch (error) {
      console.error('Failed to export template group:', error);
    }
  };

  const handleImportZip = async (file: File) => {
    setImporting(true);
    try {
      const preview = await templateApi.previewImportGroupZip(file);
      const existingNames = new Set(templateGroups.map((group) => group.name));
      const buildSuggestedName = (baseName: string) => {
        const suffix = '-导入';
        let candidate = `${baseName}${suffix}`;
        let index = 2;
        while (existingNames.has(candidate)) {
          candidate = `${baseName}${suffix}${index}`;
          index += 1;
        }
        return candidate;
      };
      const suggestedName = buildSuggestedName(preview.groupName);
      const defaultImportName = preview.groupName;

      Modal.confirm({
        title: '导入 ZIP 预检查',
        width: 560,
        content: (
          <div>
            <p>模板组名：{preview.groupName}</p>
            <p>模板文件数：{preview.fileCount}</p>
            <p>模板组重名：{preview.hasDuplicateGroupName ? '是' : '否'}</p>
            <p>ZIP 内文件名重复：{preview.hasDuplicateFileNames ? '是' : '否'}</p>
            <Input
              id="importGroupName"
              defaultValue={defaultImportName}
              style={{ marginTop: 8 }}
              placeholder="请输入导入后模板组名"
              status={preview.hasDuplicateGroupName ? 'error' : undefined}
            />
            {preview.hasDuplicateGroupName && (
              <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                检测到重名，建议使用：{suggestedName}
                <Button
                  type="link"
                  size="small"
                  style={{ paddingInline: 6 }}
                  onClick={() => {
                    const input = document.getElementById(
                      'importGroupName',
                    ) as HTMLInputElement | null;
                    if (input) {
                      input.value = suggestedName;
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                >
                  使用建议名称
                </Button>
              </div>
            )}
          </div>
        ),
        okText: '确认导入',
        cancelText: '取消',
        onOk: async () => {
          const input = document.getElementById('importGroupName') as HTMLInputElement | null;
          const groupName = input?.value?.trim();
          if (!groupName) {
            message.error('请输入导入后模板组名');
            throw new Error('groupName is required');
          }
          const imported = await templateApi.importGroupZipWithName(file, groupName);
          addTemplateGroup(imported);
          message.success(t('common.success'));
        },
      });
    } catch (error) {
      console.error('Failed to import template group:', error);
    } finally {
      setImporting(false);
    }
    return false;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const tags = values.tags
        ? values.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];
      const dto: CreateTemplateGroupDto = {
        name: values.name,
        description: values.description,
        tags,
      };

      if (editingId) {
        const updated = await templateApi.updateGroup(editingId, dto);
        updateTemplateGroup(editingId, updated);
        message.success(t('common.success'));
      } else {
        const created = await templateApi.createGroup(dto);
        addTemplateGroup(created);
        message.success(t('common.success'));
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to submit template group:', error);
    }
  };

  const getMoreActionItems = (item: TemplateGroup): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: t('template.exportZip'),
      },
    ];

    if (item.is_builtin !== 1) {
      items.unshift({
        key: 'editGroup',
        icon: <EditOutlined />,
        label: t('common.edit'),
      });
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: <span style={{ color: '#ff4d4f' }}>{t('common.delete')}</span>,
      });
    }
    return items;
  };

  const handleMoreActionClick = (item: TemplateGroup, key: string) => {
    if (key === 'editGroup') {
      handleEdit(item);
      return;
    }
    if (key === 'export') {
      handleExportZip(item.id);
      return;
    }
    if (key === 'delete') {
      handleDeleteConfirm(item.id);
    }
  };

  return (
    <div>
      <Card
        title={t('template.title')}
        extra={
          <Space>
            <Upload
              accept=".zip"
              showUploadList={false}
              beforeUpload={handleImportZip}
              disabled={importing}
            >
              <Button icon={<UploadOutlined />} loading={importing}>
                {t('template.importZip')}
              </Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('template.createGroup')}
            </Button>
          </Space>
        }
      >
        <List
          loading={loading}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={templateGroups}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <FileTextOutlined style={{ marginRight: 8, flexShrink: 0 }} />
                    <Tooltip title={item.name}>
                      <span
                        style={{
                          display: 'block',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}
                      >
                        {item.name}
                      </span>
                    </Tooltip>
                  </div>
                }
                extra={
                  item.is_builtin ? (
                    <Tag color="blue">{t('template.builtin')}</Tag>
                  ) : (
                    <Tag color="green">{t('template.custom')}</Tag>
                  )
                }
              >
                <p style={{ minHeight: 40, color: '#666' }}>{item.description || '-'}</p>
                {item.tags && (
                  <div style={{ marginBottom: 12 }}>
                    {(typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags).map(
                      (tag: string) => (
                        <Tag key={tag}>{tag}</Tag>
                      ),
                    )}
                  </div>
                )}
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" block onClick={() => handleEditFiles(item.id)}>
                    {t('template.editTemplate')}
                  </Button>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleClone(item.id)}
                    >
                      复制
                    </Button>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: getMoreActionItems(item),
                        onClick: ({ key }) => handleMoreActionClick(item, key),
                      }}
                    >
                      <Button size="small">更多</Button>
                    </Dropdown>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingId ? t('template.editGroup') : t('template.createGroup')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('template.groupName')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder={t('common.pleaseInput')} />
          </Form.Item>

          <Form.Item name="description" label={t('template.groupDescription')}>
            <Input.TextArea rows={3} placeholder={t('common.pleaseInput')} />
          </Form.Item>

          <Form.Item name="tags" label={t('template.tags')}>
            <Input placeholder="Java, Spring Boot, Backend" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
