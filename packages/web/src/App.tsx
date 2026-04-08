import { ConfigProvider, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { configApi } from '@/api';
import { useThemeStore } from '@/stores/theme';
import { router } from './router';
import './i18n';

export default function App() {
  const { i18n } = useTranslation();
  const themeMode = useThemeStore((state) => state.themeMode);

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
  const algorithm = themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const darkThemeOverrides = {
    token: {
      // 避免纯黑，使用更柔和的深灰蓝色系
      colorBgBase: '#121821',
      colorBgLayout: '#151d28',
      colorBgContainer: '#1b2430',
      colorBgElevated: '#222d3b',
      colorBorderSecondary: '#2b3a4d',
    },
    components: {
      Layout: {
        siderBg: '#162131',
        headerBg: '#1b2430',
        bodyBg: '#151d28',
      },
      Menu: {
        darkItemBg: '#162131',
        darkSubMenuItemBg: '#1a2637',
        darkItemSelectedBg: '#27476e',
        darkItemHoverBg: '#1f3249',
      },
    },
  } as const;

  return (
    <ConfigProvider
      locale={locale}
      theme={themeMode === 'dark' ? { algorithm, ...darkThemeOverrides } : { algorithm }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
