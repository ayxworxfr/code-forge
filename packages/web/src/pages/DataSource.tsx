import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Space,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { datasourceApi } from '@/api';
import { useDataSourceStore } from '@/stores';
import type { DataSource, CreateDataSourceDto, UpdateDataSourceDto } from '@/types';
import type { ColumnsType } from 'antd/es/table';

export default function DataSourcePage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { dataSources, setDataSources, addDataSource, updateDataSource, removeDataSource } =
    useDataSourceStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testingForm, setTestingForm] = useState(false);
  const [formTestStatus, setFormTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [editingSnapshot, setEditingSnapshot] = useState<{
    host: string;
    port: number;
    username: string;
    database_name: string;
  } | null>(null);

  useEffect(() => {
    loadDataSources();
  }, []);

  const formatConnectionSuccessMessage = (result: { version?: string; latency?: number }) => {
    const details: string[] = [];
    if (result.version) {
      details.push(result.version);
    }
    if (typeof result.latency === 'number' && Number.isFinite(result.latency)) {
      details.push(`${result.latency}ms`);
    }
    return details.length > 0
      ? `${t('datasource.connectionSuccess')} (${details.join(', ')})`
      : t('datasource.connectionSuccess');
  };

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const data = await datasourceApi.findAll();
      setDataSources(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldValue('port', 3306);
    setEditingId(null);
    setEditingSnapshot(null);
    setFormTestStatus('idle');
    setModalVisible(true);
  };

  const handleEdit = (record: DataSource) => {
    form.setFieldsValue({
      ...record,
      // 编辑场景下不回填真实密码，空值代表“保持原密码不变”
      password: '',
    });
    setEditingId(record.id);
    setEditingSnapshot({
      host: record.host,
      port: record.port,
      username: record.username,
      database_name: record.database_name,
    });
    setFormTestStatus('idle');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await datasourceApi.remove(id);
      removeDataSource(id);
      message.success(t('common.success'));
    } catch (error) {
      console.error('Failed to delete datasource:', error);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await datasourceApi.testConnection(id);
      if (result.success) {
        message.success(formatConnectionSuccessMessage(result));
      } else {
        message.error(`${t('datasource.connectionFailed')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const doSave = async () => {
        if (editingId) {
          const payload: UpdateDataSourceDto = { ...values };
          if (!payload.password) {
            delete payload.password;
          }
          const updated = await datasourceApi.update(editingId, payload);
          updateDataSource(editingId, updated);
          message.success(t('common.success'));
        } else {
          const created = await datasourceApi.create(values as CreateDataSourceDto);
          addDataSource(created);
          message.success(t('common.success'));
        }
        setModalVisible(false);
        setFormTestStatus('idle');
        setEditingSnapshot(null);
      };

      if (formTestStatus !== 'success') {
        Modal.confirm({
          title: t('datasource.testNotPassedTitle'),
          content: t('datasource.testNotPassedMessage'),
          okText: t('datasource.saveWithRisk'),
          cancelText: t('common.cancel'),
          okButtonProps: { danger: true },
          onOk: doSave,
        });
        return;
      }

      await doSave();
    } catch (error) {
      console.error('Failed to submit datasource:', error);
    }
  };

  const handleTestCurrentConfig = async () => {
    setTestingForm(true);
    try {
      const values = (await form.validateFields()) as CreateDataSourceDto;

      let result;
      const isEditingWithoutPassword = Boolean(editingId) && !values.password;
      if (isEditingWithoutPassword) {
        const connectionFieldsChanged =
          !editingSnapshot ||
          values.host !== editingSnapshot.host ||
          values.port !== editingSnapshot.port ||
          values.username !== editingSnapshot.username ||
          values.database_name !== editingSnapshot.database_name;

        if (connectionFieldsChanged) {
          setFormTestStatus('failed');
          message.error('已修改连接信息，请重新输入密码后再测试连接');
          return;
        }

        result = await datasourceApi.testConnection(editingId as number);
      } else {
        result = await datasourceApi.testConnectionByConfig(values);
      }

      if (result.success) {
        setFormTestStatus('success');
        message.success(formatConnectionSuccessMessage(result));
      } else {
        setFormTestStatus('failed');
        message.error(`${t('datasource.connectionFailed')}: ${result.message}`);
      }
    } catch (error) {
      setFormTestStatus('failed');
      console.error('Failed to test current datasource config:', error);
    } finally {
      setTestingForm(false);
    }
  };

  const columns: ColumnsType<DataSource> = [
    {
      title: t('datasource.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('datasource.host'),
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: t('datasource.port'),
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: t('datasource.databaseName'),
      dataIndex: 'database_name',
      key: 'database_name',
    },
    {
      title: t('datasource.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            loading={testingId === record.id}
            onClick={() => handleTest(record.id)}
          >
            {t('datasource.testConnection')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('datasource.deleteDataSourceConfirm')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('datasource.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('datasource.createDataSource')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSources}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingId ? t('datasource.editDataSource') : t('datasource.createDataSource')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingSnapshot(null);
          setFormTestStatus('idle');
        }}
        width={600}
        footer={[
          <Button key="test" loading={testingForm} onClick={handleTestCurrentConfig}>
            {t('datasource.testConnection')}
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              setModalVisible(false);
              setEditingSnapshot(null);
              setFormTestStatus('idle');
            }}
          >
            {t('common.cancel')}
          </Button>,
          <Button key="save" type="primary" onClick={handleSubmit}>
            {t('common.save')}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => {
            if (formTestStatus !== 'idle') {
              setFormTestStatus('idle');
            }
          }}
        >
          <Form.Item
            name="name"
            label={t('datasource.name')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder={t('common.pleaseInput')} />
          </Form.Item>

          <Form.Item
            name="host"
            label={t('datasource.host')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            name="port"
            label={t('datasource.port')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue={3306}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="username"
            label={t('datasource.username')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="root" />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('datasource.password')}
            rules={
              editingId
                ? []
                : [
                    {
                      required: true,
                      message: t('common.required'),
                    },
                  ]
            }
          >
            <Input.Password
              placeholder={editingId ? '留空则保持原密码不变' : t('common.pleaseInput')}
            />
          </Form.Item>

          <Form.Item
            name="database_name"
            label={t('datasource.databaseName')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="my_database" />
          </Form.Item>

          <Form.Item name="description" label={t('datasource.description')}>
            <Input.TextArea rows={3} placeholder={t('common.pleaseInput')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
