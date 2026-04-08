import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Select, Alert, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { configApi, templateApi } from '@/api';
import type { TemplateGroup } from '@/types';

export default function ConfigPage() {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const packageName = Form.useWatch('defaultPackageName', form);
  const moduleName = Form.useWatch('defaultModuleName', form);
  const tablePrefix = Form.useWatch('defaultTablePrefix', form);
  const author = Form.useWatch('defaultAuthor', form);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [data, groups] = await Promise.all([configApi.getAll(), templateApi.findAllGroups()]);
      form.setFieldsValue(data);
      setTemplateGroups(groups);
    } catch (error) {
      console.error('Failed to load initial data:', error);
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
        localStorage.setItem('codeforge-locale', values.defaultLocale);
        i18n.changeLanguage(values.defaultLocale);
        message.info(t('common.languageChanged'));
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
          message={t('common.globalConfigHelpTitle')}
          description={t('common.globalConfigHelpDesc')}
        />

        <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
          <Form.Item
            name="defaultLocale"
            label={t('common.defaultLanguage')}
            initialValue="zh-CN"
            extra={t('common.defaultLanguageHelp')}
          >
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defaultTimezone"
            label={t('common.defaultTimezone')}
            initialValue="Asia/Shanghai"
            extra={t('common.defaultTimezoneHelp')}
          >
            <Select>
              <Select.Option value="Asia/Shanghai">{t('common.timezoneShanghai')}</Select.Option>
              <Select.Option value="UTC">{t('common.timezoneUtc')}</Select.Option>
              <Select.Option value="Asia/Tokyo">{t('common.timezoneTokyo')}</Select.Option>
              <Select.Option value="America/New_York">{t('common.timezoneNewYork')}</Select.Option>
              <Select.Option value="Europe/London">{t('common.timezoneLondon')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defaultAuthor"
            label={t('generator.author')}
            initialValue="admin"
            extra={t('common.authorHelp')}
            rules={[{ required: true, message: t('common.authorRequired') }]}
          >
            <Input placeholder={t('common.pleaseInput')} />
          </Form.Item>

          <Form.Item
            name="defaultPackageName"
            label={t('generator.basePackage')}
            initialValue="com.example.demo"
            extra={t('common.basePackageHelp')}
            rules={[
              { required: true, message: t('common.basePackageRequired') },
              {
                pattern: /^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/,
                message: t('common.basePackageInvalid'),
              },
            ]}
          >
            <Input placeholder="com.example.demo" />
          </Form.Item>

          <Form.Item
            name="defaultModuleName"
            label={t('generator.moduleName')}
            initialValue="system"
            extra={t('common.moduleNameHelp')}
            rules={[
              { required: true, message: t('common.moduleNameRequired') },
              {
                pattern: /^[a-z][a-z0-9-]*$/,
                message: t('common.moduleNameInvalid'),
              },
            ]}
          >
            <Input placeholder="system" />
          </Form.Item>

          <Form.Item
            name="defaultTablePrefix"
            label={t('generator.tablePrefix')}
            initialValue="sys_"
            extra={t('common.tablePrefixHelp')}
            rules={[
              {
                pattern: /^$|^[a-zA-Z][a-zA-Z0-9_]*$/,
                message: t('common.tablePrefixInvalid'),
              },
            ]}
          >
            <Input placeholder="sys_" />
          </Form.Item>

          <Form.Item
            name="defaultTemplateGroupId"
            label={t('common.defaultTemplateGroupId')}
            initialValue="1"
            extra={t('common.defaultTemplateGroupHelp')}
            rules={[{ required: true, message: t('common.defaultTemplateGroupRequired') }]}
          >
            <Select
              placeholder={t('common.pleaseSelect')}
              options={templateGroups.map((group) => ({
                label: group.name,
                value: String(group.id),
              }))}
            />
          </Form.Item>

          <Card size="small" title={t('common.previewCardTitle')} style={{ background: '#fafafa' }}>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {t('common.previewSampleTable', {
                value: `${tablePrefix || t('common.noPrefix')}account`,
              })}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {t('common.previewEntityName')}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {t('common.previewApiPath', { moduleName: moduleName || 'system' })}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {t('common.previewAuthor', { author: author || 'admin' })}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              {t('common.previewPackagePath', {
                packageName: packageName || 'com.example.demo',
                path: (packageName || 'com.example.demo').replaceAll('.', '/'),
              })}
            </Typography.Text>
          </Card>
        </Form>
      </Card>
    </div>
  );
}
