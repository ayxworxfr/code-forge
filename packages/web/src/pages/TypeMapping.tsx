import { useEffect, useState } from 'react';
import { Button, Card, Table, Modal, Form, Input, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { typeMappingApi } from '@/api';
import type { TypeMapping, CreateTypeMappingDto } from '@/types';
import type { ColumnsType } from 'antd/es/table';

export default function TypeMappingPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [mappings, setMappings] = useState<TypeMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await typeMappingApi.findAll();
      setMappings(data);
    } catch (error) {
      console.error('Failed to load type mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record: TypeMapping) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await typeMappingApi.remove(id);
      message.success(t('common.success'));
      loadMappings();
    } catch (error) {
      console.error('Failed to delete type mapping:', error);
    }
  };

  const handleReset = async () => {
    try {
      await typeMappingApi.reset();
      message.success(t('common.success'));
      loadMappings();
    } catch (error) {
      console.error('Failed to reset type mappings:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await typeMappingApi.update(editingId, values);
        message.success(t('common.success'));
      } else {
        await typeMappingApi.create(values as CreateTypeMappingDto);
        message.success(t('common.success'));
      }
      setModalVisible(false);
      loadMappings();
    } catch (error) {
      console.error('Failed to submit type mapping:', error);
    }
  };

  const columns: ColumnsType<TypeMapping> = [
    {
      title: t('common.mysqlType'),
      dataIndex: 'source_type',
      key: 'source_type',
      width: 150,
    },
    {
      title: t('common.javaType'),
      dataIndex: 'java_type',
      key: 'java_type',
      width: 150,
    },
    {
      title: t('common.typescriptType'),
      dataIndex: 'ts_type',
      key: 'ts_type',
      width: 150,
    },
    {
      title: t('common.jdbcType'),
      dataIndex: 'jdbc_type',
      key: 'jdbc_type',
      width: 150,
    },
    {
      title: t('common.type'),
      dataIndex: 'is_builtin',
      key: 'is_builtin',
      width: 100,
      render: (isBuiltin: number) =>
        isBuiltin ? (
          <Tag color="blue">{t('common.builtin')}</Tag>
        ) : (
          <Tag color="green">{t('common.custom')}</Tag>
        ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          {!record.is_builtin && (
            <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('menu.typeMapping')}
        extra={
          <Space>
            <Popconfirm title={t('common.resetTypeMappingConfirm')} onConfirm={handleReset}>
              <Button icon={<ReloadOutlined />}>{t('common.reset')}</Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('common.create')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={mappings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingId ? t('common.edit') : t('common.create')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="source_type"
            label={t('common.mysqlType')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="varchar" disabled={editingId !== null} />
          </Form.Item>

          <Form.Item
            name="java_type"
            label={t('common.javaType')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="String" />
          </Form.Item>

          <Form.Item
            name="ts_type"
            label={t('common.typescriptType')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="string" />
          </Form.Item>

          <Form.Item
            name="jdbc_type"
            label={t('common.jdbcType')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="VARCHAR" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
