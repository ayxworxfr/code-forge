import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { router } from './router';
import './i18n';

export default function App() {
  const { i18n } = useTranslation();

  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider locale={locale}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
