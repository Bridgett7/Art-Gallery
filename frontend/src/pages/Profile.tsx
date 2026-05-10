import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Tabs, message, Avatar, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Title, Text } = Typography;

export default function Profile() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      form.setFieldsValue({
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
      });
      if (res.data.address) {
        addressForm.setFieldsValue(res.data.address);
      }
    } catch (err) {
      // fallback to context
      form.setFieldsValue({
        username: user?.username,
        email: user?.email,
        role: user?.role,
      });
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue(['username', 'email']);
      await api.put('/users/profile', values);
      message.success('Profile updated');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const values = form.getFieldsValue(['currentPassword', 'newPassword', 'confirmPassword']);
    if (!values.currentPassword || !values.newPassword) {
      message.error('Fill in all password fields');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed');
      form.setFieldsValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (values: any) => {
    setLoading(true);
    try {
      await api.put('/users/address', values);
      message.success('Address updated');
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'info',
      label: 'Personal Information',
      children: (
        <Row gutter={40} align="top">
          <Col span={12} style={{ textAlign: 'center', paddingTop: 20 }}>
            <Avatar size={180} icon={<UserOutlined />} style={{ border: '2px solid #eee' }} />
          </Col>
          <Col span={12}>
            <Form form={form} layout="vertical">
              <Form.Item name="username" label="Username">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
              <Form.Item name="role" label="Role">
                <Input disabled />
              </Form.Item>
              <Button type="primary" onClick={handleUpdateProfile} loading={loading}>
                Update Profile
              </Button>
            </Form>
          </Col>
        </Row>
      ),
    },
    {
      key: 'password',
      label: 'Password',
      children: (
        <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
          <Title level={5}>Change Password</Title>
          <Form.Item name="currentPassword" label="Current Password">
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password">
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Confirm New Password">
            <Input.Password />
          </Form.Item>
          <Button type="primary" onClick={handleChangePassword} loading={loading}>
            Change Password
          </Button>
        </Form>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      children: (
        <Form form={addressForm} layout="vertical" onFinish={handleUpdateAddress} style={{ maxWidth: 500 }}>
          <Form.Item name="street" label="Street">
            <Input />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label="Postal Code">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update Address
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>MY PROFILE</Title>
        <Text type="secondary">Manage your account settings</Text>
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
