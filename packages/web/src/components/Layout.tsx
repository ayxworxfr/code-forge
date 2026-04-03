import { useState } from 'react';
import { Layout as AntLayout, Menu, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SwapOutlined,
  HistoryOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import logoIcon from '@/assets/logo-icon.svg';
import logoFull from '@/assets/logo-full.svg';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <ThunderboltOutlined />,
      label: t('menu.generator'),
    },
    {
      key: '/datasource',
      icon: <DatabaseOutlined />,
      label: t('menu.datasource'),
    },
    {
      key: '/template',
      icon: <FileTextOutlined />,
      label: t('menu.template'),
    },
    {
      key: '/type-mapping',
      icon: <SwapOutlined />,
      label: t('menu.typeMapping'),
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: t('menu.history'),
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: t('menu.config'),
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: collapsed ? 0 : '0 10px',
          }}
        >
          <img
            src={collapsed ? logoIcon : logoFull}
            alt="CodeForge"
            style={{
              width: collapsed ? 28 : '100%',
              maxWidth: collapsed ? 28 : 180,
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
