import React, { useEffect, useState } from 'react';
import { Typography, Button, Card, List, Tag, Space, message, Empty } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const { Title, Text } = Typography;

interface NotificationData {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [notifRes, countRes] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count'),
    ]);
    setNotifications(notifRes.data);
    setUnreadCount(countRes.data.count);
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/mark-all-read');
    message.success(t('notifications.markAllRead'));
    loadData();
  };

  const handleClearRead = async () => {
    await api.delete('/notifications/clear-read');
    message.success(t('notifications.clearRead'));
    loadData();
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('notifications.title')}</Title>
        <Text type="secondary">{t('notifications.subtitle')}</Text>
      </div>

      <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button icon={<CheckOutlined />} onClick={handleMarkAllRead}>{t('notifications.markAllRead')}</Button>
        <Button icon={<DeleteOutlined />} danger onClick={handleClearRead}>{t('notifications.clearRead')}</Button>
      </Space>

      <Card>
        {notifications.length === 0 ? (
          <Empty description={t('notifications.noNotifications')} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notif) => (
              <List.Item style={{ background: notif.read ? undefined : '#f6ffed', padding: '12px 16px', borderRadius: 8, marginBottom: 8 }}>
                <List.Item.Meta
                  title={<Space>{notif.title} {!notif.read && <Tag color="blue">{t('notifications.new')}</Tag>}</Space>}
                  description={<><Text>{notif.message}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{notif.createdAt}</Text></>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
