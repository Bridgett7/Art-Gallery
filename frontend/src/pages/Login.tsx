import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { Title, Text } = Typography;

export default function Login() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: { usernameOrEmail: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      login(res.data);
      message.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2B3A67 0%, #496A81 50%, #66999B 100%)',
    }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -8, right: -8 }}><LanguageSwitcher /></div>
            <Title level={2} style={{ margin: 0, color: '#2B3A67', letterSpacing: 1 }}>🎨 MetaMuse</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('app.tagline')}</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="usernameOrEmail"
              rules={[{ required: true, message: t('auth.usernameOrEmail') }]}
            >
              <Input prefix={<UserOutlined />} placeholder={t('auth.usernameOrEmail')} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: t('auth.password') }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.password')}
                iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}
                style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>

          <Space split={<Text type="secondary">|</Text>}>
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
            <Link to="/register">{t('auth.register')}</Link>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
