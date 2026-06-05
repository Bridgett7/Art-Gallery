import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space, Divider, Progress } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 25;
    return score;
  };

  const onFinish = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error(t('auth.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
        street: values.street,
        city: values.city,
        country: values.country,
        postalCode: values.postalCode,
      });
      login(res.data);
      message.success(t('auth.accountCreated'));
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
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
      padding: '20px 0',
    }}>
      <Card style={{ width: 480, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '90vh', overflow: 'auto' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#2B3A67' }}>{t('auth.createAccount')}</Title>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item name="username" rules={[{ required: true, message: t('auth.required') }]}>
              <Input prefix={<UserOutlined />} placeholder={t('auth.username')} />
            </Form.Item>

            <Form.Item name="email" rules={[
              { required: true, message: t('auth.required') },
              { type: 'email', message: t('auth.invalidEmail') }
            ]}>
              <Input prefix={<MailOutlined />} placeholder={t('auth.email')} />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: t('auth.required') }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.password')}
                onChange={(e) => setPasswordStrength(calculateStrength(e.target.value))}
              />
            </Form.Item>

            <Progress
              percent={passwordStrength}
              showInfo={false}
              strokeColor={passwordStrength < 50 ? '#ff4d4f' : passwordStrength < 75 ? '#faad14' : '#52c41a'}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t('auth.passwordStrength')}
            </Text>

            <Form.Item name="confirmPassword" rules={[{ required: true, message: t('auth.confirmPassword') }]}
              style={{ marginTop: 12 }}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('auth.confirmPassword')} />
            </Form.Item>

            <Form.Item name="role" rules={[{ required: true, message: t('auth.selectRole') }]}>
              <Select placeholder={t('auth.role')}>
                <Select.Option value="ARTIST">{t('auth.artist')}</Select.Option>
                <Select.Option value="VISITOR">{t('auth.visitor')}</Select.Option>
              </Select>
            </Form.Item>

            <Divider>{t('auth.addressOptional')}</Divider>

            <Form.Item name="street">
              <Input placeholder={t('profile.street')} />
            </Form.Item>
            <Form.Item name="city">
              <Input placeholder={t('profile.city')} />
            </Form.Item>
            <Form.Item name="country">
              <Input placeholder={t('profile.country')} />
            </Form.Item>
            <Form.Item name="postalCode">
              <Input placeholder={t('profile.postalCode')} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}
                style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                {t('auth.register')}
              </Button>
            </Form.Item>
          </Form>

          <Link to="/login">{t('auth.login')}</Link>
        </Space>
      </Card>
    </div>
  );
}
