import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Badge, Space } from 'antd';
import {
  DashboardOutlined,
  PictureOutlined,
  CalendarOutlined,
  BookOutlined,
  ScheduleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import GlobalSearch from '../components/GlobalSearch';
import ChatWidget from '../components/ChatWidget';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    // Fetch active order item count
    fetch('/api/orders/active', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => { if (data.itemCount) setCartCount(data.itemCount); })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/artworks', icon: <PictureOutlined />, label: 'Artworks' },
    { key: '/events', icon: <CalendarOutlined />, label: 'Exhibitions' },
    { key: '/courses', icon: <BookOutlined />, label: 'Courses' },
    { key: '/planning', icon: <ScheduleOutlined />, label: 'Planning' },
    { key: '/marketplace', icon: <ShopOutlined />, label: 'Marketplace' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Orders' },
    ...(user?.role === 'ADMIN' ? [
      { key: '/users', icon: <TeamOutlined />, label: 'Users' },
    ] : []),
    { key: '/notifications', icon: <BellOutlined />, label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications' },
    { key: '/profile', icon: <UserOutlined />, label: 'Account' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          background: '#2B3A67',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{ padding: '24px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Text strong style={{ color: 'white', fontSize: collapsed ? 16 : 22, letterSpacing: 1 }}>
              🎨 {!collapsed && 'METAMUSE'}
            </Text>
          </div>

          {/* Menu */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{
                background: 'transparent',
                borderRight: 0,
                marginTop: 8,
              }}
              theme="dark"
            />
          </div>

          {/* User info + Logout */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px' }}>
            {!collapsed && (
              <div style={{ marginBottom: 8, padding: '0 8px' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Logged in as</Text>
                <br />
                <Text strong style={{ color: 'white', fontSize: 13 }}>{user?.username}</Text>
              </div>
            )}
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'left', height: 40 }}
            >
              {!collapsed && 'Logout'}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <GlobalSearch />
          <Space size={16}>
            <Badge count={cartCount} size="small">
              <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate('/orders')} />
            </Badge>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/notifications')} />
            </Badge>
          </Space>
        </Header>
        <Content style={{ background: '#F5F3F7', padding: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
      <ChatWidget />
    </Layout>
  );
}
