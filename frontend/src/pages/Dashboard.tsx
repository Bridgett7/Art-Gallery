import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const { Title, Text } = Typography;

interface DashboardStats {
  [key: string]: any;
}

const KpiCard = ({ icon, title, value, subtitle, color }: { icon: string; title: string; value: string; subtitle: string; color: string }) => (
  <Card style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: '24px' }}>
    <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
    <Text type="secondary" style={{ fontSize: 13 }}>{title}</Text>
    <div style={{ fontSize: 28, fontWeight: 700, color, margin: '4px 0' }}>{value}</div>
    <Text type="secondary" style={{ fontSize: 11 }}>{subtitle}</Text>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch { /* silent */ }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('dashboard.title').toUpperCase()}</Title>
        <Text type="secondary">{t('dashboard.revenueTrend')}</Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon="💰" title={t('dashboard.totalRevenue')} value={`${(stats?.totalRevenue || 0).toFixed(2)} DT`}
            subtitle={t('dashboard.deliveredOrders')} color="#27AE60" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon="📈" title={t('dashboard.predictedGains')} value={`${(stats?.predictedGains || 0).toFixed(2)} DT`}
            subtitle={`${t('dashboard.pendingOrders')} / ${t('dashboard.confirmedOrders')}`} color="#F39C12" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon="📦" title={t('dashboard.totalOrders')} value={`${stats?.totalOrders || 0}`}
            subtitle={t('orders.allOrders')} color="#3498DB" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon="🎨" title={t('dashboard.exhibitionRevenue')} value={`${(stats?.exhibitionRevenue || 0).toFixed(2)} DT`}
            subtitle={t('dashboard.totalTickets')} color="#9B59B6" />
        </Col>
      </Row>

      {/* Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card title={`📊 ${t('orders.status')}`} style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row justify="space-between"><Text>⏳ {t('dashboard.pendingOrders')}</Text><Text strong style={{ color: '#F39C12' }}>{stats?.pendingOrders || 0}</Text></Row>
              <Row justify="space-between"><Text>✅ {t('dashboard.confirmedOrders')}</Text><Text strong style={{ color: '#3498DB' }}>{stats?.confirmedOrders || 0}</Text></Row>
              <Row justify="space-between"><Text>🚚 {t('dashboard.shippedOrders')}</Text><Text strong style={{ color: '#9B59B6' }}>{stats?.shippedOrders || 0}</Text></Row>
              <Row justify="space-between"><Text>📦 {t('dashboard.deliveredOrders')}</Text><Text strong style={{ color: '#27AE60' }}>{stats?.deliveredOrders || 0}</Text></Row>
              <Row justify="space-between"><Text>❌ {t('dashboard.cancelledOrders')}</Text><Text strong style={{ color: '#E74C3C' }}>{stats?.cancelledOrders || 0}</Text></Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title={`🎨 ${t('nav.marketplace')}`} style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row justify="space-between"><Text>{t('dashboard.totalProducts')}</Text><Text strong>{stats?.totalProducts || 0}</Text></Row>
              <Row justify="space-between"><Text>{t('dashboard.productsSold')}</Text><Text strong style={{ color: '#27AE60' }}>{stats?.productsSold || 0}</Text></Row>
              <Row justify="space-between"><Text>{t('dashboard.totalUsers')}</Text><Text strong style={{ color: '#3498DB' }}>{stats?.totalUsers || 0}</Text></Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title={`🏛️ ${t('nav.exhibitions')}`} style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row justify="space-between"><Text>{t('dashboard.totalEvents')}</Text><Text strong style={{ color: '#3498DB' }}>{stats?.totalEvents || 0}</Text></Row>
              <Row justify="space-between"><Text>{t('dashboard.totalTickets')}</Text><Text strong style={{ color: '#27AE60' }}>{stats?.totalTickets || 0}</Text></Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title={`🎓 ${t('nav.courses')}`} style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row justify="space-between"><Text>📚 {t('nav.courses')}</Text><Text strong style={{ color: '#2B3A67' }}>{stats?.totalCourses || 0}</Text></Row>
              <Row justify="space-between"><Text>📝 {t('courses.lessons')}</Text><Text strong style={{ color: '#3498DB' }}>{stats?.totalLessons || 0}</Text></Row>
              <Row justify="space-between"><Text>📅 {t('planning.scheduled')}</Text><Text strong style={{ color: '#F39C12' }}>{stats?.scheduledLessons || 0}</Text></Row>
              <Row justify="space-between"><Text>✅ {t('planning.completed')}</Text><Text strong style={{ color: '#27AE60' }}>{stats?.completedLessons || 0}</Text></Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Card title={`📈 ${t('dashboard.revenueTrend')}`} style={{ borderRadius: 12, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stats?.revenueTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(2)} DT`, t('dashboard.totalRevenue')]} />
            <Line type="monotone" dataKey="revenue" stroke="#2B3A67" strokeWidth={2.5} dot={{ r: 5, fill: '#2B3A67' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
