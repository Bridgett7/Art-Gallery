import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Steps } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setEmail(values.email);
      message.success('Reset code sent to your email');
      setStep(1);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (values: { token: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword(values.token, values.newPassword);
      message.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2B3A67 0%, #496A81 50%, #66999B 100%)',
    }}>
      <Card style={{ width: 440, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#2B3A67' }}>Reset Password</Title>
            <Text type="secondary">
              {step === 0 ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}
            </Text>
          </div>

          <Steps current={step} size="small" items={[
            { title: 'Email' },
            { title: 'Reset' },
          ]} />

          {step === 0 ? (
            <Form layout="vertical" onFinish={handleSendCode} size="large">
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
                <Input prefix={<MailOutlined />} placeholder="Your email address" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}
                  style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                  Send Reset Code
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form layout="vertical" onFinish={handleResetPassword} size="large">
              <Form.Item name="token" rules={[{ required: true, message: 'Enter the reset code' }]}>
                <Input prefix={<SafetyOutlined />} placeholder="Reset code (6 characters)" maxLength={6} />
              </Form.Item>
              <Form.Item name="newPassword" rules={[{ required: true, min: 8, message: 'Min 8 characters' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="New password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}
                  style={{ background: '#2B3A67', borderColor: '#2B3A67', height: 44 }}>
                  Reset Password
                </Button>
              </Form.Item>
              <Button type="link" onClick={() => setStep(0)}>← Back to email</Button>
            </Form>
          )}

          <Link to="/login">Back to Login</Link>
        </Space>
      </Card>
    </div>
  );
}
