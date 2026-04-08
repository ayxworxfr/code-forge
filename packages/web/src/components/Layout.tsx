import { useEffect, useState } from 'react';
import { Button, Grid, Layout as AntLayout, Menu, Space, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SwapOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import logoIcon from '@/assets/logo-icon.svg';
import { useThemeStore } from '@/stores/theme';

const { Header, Sider, Content } = AntLayout;
const { useBreakpoint } = Grid;

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const themeMode = useThemeStore((state) => state.themeMode);
  const toggleThemeMode = useThemeStore((state) => state.toggleThemeMode);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isDark = themeMode === 'dark';
  const siderTheme = isDark ? 'dark' : 'light';
  const {
    token: { colorBgContainer, borderRadiusLG, colorText, colorTextSecondary },
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

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        theme={siderTheme}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={236}
        collapsedWidth={72}
        breakpoint="md"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{
          borderRight: siderTheme === 'light' ? '1px solid #f0f0f0' : '1px solid #1f1f1f',
        }}
      >
        <div
          style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: collapsed ? 0 : '0 16px',
          }}
        >
          <img
            src={logoIcon}
            alt="CodeForge"
            style={{
              width: 28,
              minWidth: 28,
              height: 'auto',
              display: 'block',
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#1677ff',
                letterSpacing: 0.3,
                lineHeight: 1,
              }}
            >
              Forge
            </span>
          )}
        </div>
        <Menu
          theme={siderTheme}
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          inlineIndent={18}
          style={{
            borderInlineEnd: 'none',
            padding: collapsed ? '8px 6px' : '8px 10px',
          }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              color: colorText,
              lineHeight: 1,
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Space>
            <span style={{ color: colorTextSecondary, fontSize: 12 }}>
              {isDark ? '暗色' : '亮色'}
            </span>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleThemeMode}
              aria-label={isDark ? '切换为亮色主题' : '切换为暗色主题'}
            />
          </Space>
        </Header>
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
