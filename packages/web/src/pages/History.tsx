import { useEffect, useState } from 'react';
import { Button, Card, Table, Popconfirm, message, Space, Tag } from 'antd';
import { DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { historyApi, configApi } from '@/api';
import type { GenHistory } from '@/types';
import type { ColumnsType } from 'antd/es/table';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function HistoryPage() {
  const { t } = useTranslation();
  const [histories, setHistories] = useState<GenHistory[]>([]);
  const [displayTimezone, setDisplayTimezone] = useState('Asia/Shanghai');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    setLoading(true);
    try {
      const [data, config] = await Promise.all([historyApi.findAll(100), configApi.getAll()]);
      setHistories(data);
      setDisplayTimezone(config.defaultTimezone || 'Asia/Shanghai');
    } catch (error) {
      console.error('Failed to load histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await historyApi.remove(id);
      message.success(t('common.success'));
      loadHistories();
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const handleClear = async () => {
    try {
      await historyApi.clear();
      message.success(t('common.success'));
      loadHistories();
    } catch (error) {
      console.error('Failed to clear histories:', error);
    }
  };

  const columns: ColumnsType<GenHistory> = [
    {
      title: t('common.dataSource'),
      dataIndex: 'datasource_name',
      key: 'datasource_name',
      width: 150,
      render: (name) => name || <Tag>{t('common.ddl')}</Tag>,
    },
    {
      title: t('common.templateGroup'),
      dataIndex: 'template_group_name',
      key: 'template_group_name',
      width: 200,
    },
    {
      title: t('common.tableName'),
      dataIndex: 'table_names',
      key: 'table_names',
      ellipsis: true,
      render: (names: string) => {
        const tableList = names.split(',');
        return (
          <Space wrap>
            {tableList.slice(0, 3).map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
            {tableList.length > 3 && <span>+{tableList.length - 3}</span>}
          </Space>
        );
      },
    },
    {
      title: t('common.fileCount'),
      dataIndex: 'file_count',
      key: 'file_count',
      width: 100,
    },
    {
      title: t('common.generatedAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs.utc(date).tz(displayTimezone).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            {t('common.delete')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('menu.history')}
        extra={
          <Popconfirm title={t('common.clearConfirm')} onConfirm={handleClear}>
            <Button icon={<ClearOutlined />} danger>
              {t('common.clearHistory')}
            </Button>
          </Popconfirm>
        }
      >
        <Table
          columns={columns}
          dataSource={histories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
