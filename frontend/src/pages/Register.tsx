import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space, Divider, Progress } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

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
      message.error('Passwords do not match');
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
      message.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Registration failed');
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
          <Title level={3} style={{ margin: 0, color: '#2B3A67' }}>Create Account</Title>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item name="username" rules={[{ required: true, message: 'Username is required' }]}>
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>

            <Form.Item name="email" rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email' }
            ]}>
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
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
              Min 8 chars, 1 uppercase, 1 digit, 1 special character
            </Text>

            <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Confirm your password' }]}
              style={{ marginTop: 12 }}>
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
            </Form.Item>

            <Form.Item name="role" rules={[{ required: true, message: 'Select a role' }]}>
              <Select placeholder="Select role">
                <Select.Option value="ARTIST">Artist</Select.Option>
                <Select.Option value="VISITOR">Visitor</Select.Option>
              </Select>
            </Form.Item>

            <Divider>Address (Optional)</Divider>

            <Form.Item name="street">
              <Input placeholder="Street" />
            </Form.Item>
            <Form.Item name="city">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="country">
              <Input placeholder="Country" />
            </Form.Item>
            <Form.Item name="postalCode">
              <Input placeholder="Postal code" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}
                style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                Register
              </Button>
            </Form.Item>
          </Form>

          <Link to="/login">Already have an account? Login</Link>
        </Space>
      </Card>
    </div>
  );
}
