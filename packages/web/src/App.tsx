import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { configApi } from '@/api';
import { router } from './router';
import './i18n';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const syncLocaleFromConfig = async () => {
      try {
        const config = await configApi.getAll();
        const locale = config.defaultLocale;
        if ((locale === 'zh-CN' || locale === 'en-US') && locale !== i18n.language) {
          localStorage.setItem('codeforge-locale', locale);
          await i18n.changeLanguage(locale);
        }
      } catch (error) {
        console.error('Failed to sync locale from config:', error);
      }
    };
    syncLocaleFromConfig();
  }, [i18n]);

  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider locale={locale}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
