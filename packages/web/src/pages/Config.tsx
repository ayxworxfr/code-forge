import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Select, Alert, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { configApi } from '@/api';

export default function ConfigPage() {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const packageName = Form.useWatch('defaultPackageName', form);
  const moduleName = Form.useWatch('defaultModuleName', form);
  const tablePrefix = Form.useWatch('defaultTablePrefix', form);
  const author = Form.useWatch('defaultAuthor', form);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await configApi.getAll();
      form.setFieldsValue(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await configApi.updateBatch(values);
      message.success(t('common.success'));

      if (values.defaultLocale && values.defaultLocale !== i18n.language) {
        i18n.changeLanguage(values.defaultLocale);
        message.info('语言已切换 / Language changed');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Card
        title={t('menu.config')}
        loading={loading}
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSubmit}>
            {t('common.save')}
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="全局配置说明"
          description="这些值会作为“代码生成”页面的默认值。你可以在生成时临时修改，不会影响这里已保存的默认配置。"
        />

        <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
          <Form.Item
            name="defaultLocale"
            label="默认语言 / Default Language"
            initialValue="zh-CN"
            extra="设置系统初始显示语言。"
          >
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defaultTimezone"
            label="默认时区 / Default Timezone"
            initialValue="Asia/Shanghai"
            extra="用于“生成历史”等时间展示。建议国内使用 Asia/Shanghai。"
          >
            <Select>
              <Select.Option value="Asia/Shanghai">北京时间（Asia/Shanghai）</Select.Option>
              <Select.Option value="UTC">UTC（协调世界时）</Select.Option>
              <Select.Option value="Asia/Tokyo">东京时间（Asia/Tokyo）</Select.Option>
              <Select.Option value="America/New_York">纽约时间（America/New_York）</Select.Option>
              <Select.Option value="Europe/London">伦敦时间（Europe/London）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defaultAuthor"
            label={t('generator.author')}
            initialValue="admin"
            extra="生成代码注释中的作者名，例如：admin、张三。"
            rules={[{ required: true, message: '请输入作者名称' }]}
          >
            <Input placeholder={t('common.pleaseInput')} />
          </Form.Item>

          <Form.Item
            name="defaultPackageName"
            label={t('generator.basePackage')}
            initialValue="com.example.demo"
            extra="Java 包名根路径，用于后端模板输出目录。示例：com.company.project"
            rules={[
              { required: true, message: '请输入基础包名' },
              {
                pattern: /^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/,
                message: '包名格式不正确，例如：com.example.demo',
              },
            ]}
          >
            <Input placeholder="com.example.demo" />
          </Form.Item>

          <Form.Item
            name="defaultModuleName"
            label={t('generator.moduleName')}
            initialValue="system"
            extra="业务模块名，会体现在 API 路径和部分文件路径中。示例：system、user-center"
            rules={[
              { required: true, message: '请输入模块名' },
              {
                pattern: /^[a-z][a-z0-9-]*$/,
                message: '模块名仅支持小写字母、数字、连字符，且必须以字母开头',
              },
            ]}
          >
            <Input placeholder="system" />
          </Form.Item>

          <Form.Item
            name="defaultTablePrefix"
            label={t('generator.tablePrefix')}
            initialValue="sys_"
            extra="用于从表名中移除统一前缀。例：sys_user 去掉 sys_ 后生成 User。留空表示不移除前缀。"
            rules={[
              {
                pattern: /^$|^[a-zA-Z][a-zA-Z0-9_]*$/,
                message: '前缀仅支持字母、数字、下划线，或留空',
              },
            ]}
          >
            <Input placeholder="sys_" />
          </Form.Item>

          <Form.Item
            name="defaultTemplateGroupId"
            label="默认模板组 ID"
            initialValue="1"
            extra="代码生成时默认选中的模板组。可在“模板管理”查看对应 ID。"
            rules={[
              { required: true, message: '请输入默认模板组 ID' },
              { pattern: /^[1-9]\d*$/, message: '模板组 ID 必须是正整数' },
            ]}
          >
            <Input placeholder="1" />
          </Form.Item>

          <Card size="small" title="实时效果预览" style={{ background: '#fafafa' }}>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              示例表名：`{(tablePrefix || '（无前缀）') + 'account'}`
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              生成实体名：`Account`
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              API 路径示例：`/{moduleName || 'system'}/account`
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              注释示例：`@author {author || 'admin'}`
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              包路径：{packageName || 'com.example.demo'}（对应目录：
              {(packageName || 'com.example.demo').replaceAll('.', '/')})
            </Typography.Text>
          </Card>
        </Form>
      </Card>
    </div>
  );
}
