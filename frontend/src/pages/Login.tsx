import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
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
          <div>
            <Title level={2} style={{ margin: 0, color: '#2B3A67', letterSpacing: 1 }}>🎨 MetaMuse</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Art Gallery Management System</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="usernameOrEmail"
              rules={[{ required: true, message: 'Enter your username or email' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username or email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}
                style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                Login
              </Button>
            </Form.Item>
          </Form>

          <Space split={<Text type="secondary">|</Text>}>
            <Link to="/forgot-password">Forgot Password?</Link>
            <Link to="/register">Register</Link>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
