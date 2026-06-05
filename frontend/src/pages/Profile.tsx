import React, { useEffect, useState, useRef } from 'react';
import { Card, Form, Input, Button, Typography, Tabs, message, Avatar, Row, Col, Upload } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const { Title, Text } = Typography;

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [picVersion, setPicVersion] = useState(Date.now());

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
      if (res.data.profilePicture) {
        setProfilePicture(res.data.profilePicture + '?v=' + Date.now());
      }
      if (res.data.address) {
        addressForm.setFieldsValue(res.data.address);
      }
    } catch (err) {
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
      message.success(t('profile.profileUpdated'));
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const values = form.getFieldsValue(['currentPassword', 'newPassword', 'confirmPassword']);
    if (!values.currentPassword || !values.newPassword) {
      message.error(t('profile.fillAllFields'));
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('auth.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(t('profile.passwordChanged'));
      form.setFieldsValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (values: any) => {
    setLoading(true);
    try {
      await api.put('/users/address', values);
      message.success(t('profile.addressUpdated'));
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'info',
      label: t('profile.personalInfo'),
      children: (
        <Row gutter={40} align="top">
          <Col span={12} style={{ textAlign: 'center', paddingTop: 20 }}>
            <Upload
              showUploadList={false}
              beforeUpload={async (file) => {
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await api.post('/users/profile-picture', formData);
                  setPicVersion(Date.now());
                  setProfilePicture(res.data.profilePicture + '?v=' + Date.now());
                  message.success(t('profile.pictureUpdated'));
                } catch { message.error(t('profile.uploadFailed')); }
                return false;
              }}
              accept="image/*"
            >
              <div style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={180}
                  src={profilePicture || undefined}
                  icon={!profilePicture ? <UserOutlined /> : undefined}
                  style={{ border: '2px solid #eee' }}
                />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: '#2B3A67', borderRadius: '50%', padding: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CameraOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
              </div>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              {t('profile.changePhoto')}
            </Text>
          </Col>
          <Col span={12}>
            <Form form={form} layout="vertical">
              <Form.Item name="username" label={t('auth.username')}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label={t('auth.email')}>
                <Input />
              </Form.Item>
              <Form.Item name="role" label={t('auth.role')}>
                <Input disabled />
              </Form.Item>
              <Button type="primary" onClick={handleUpdateProfile} loading={loading}>
                {t('profile.updateProfile')}
              </Button>
            </Form>
          </Col>
        </Row>
      ),
    },
    {
      key: 'password',
      label: t('profile.password'),
      children: (
        <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
          <Title level={5}>{t('profile.changePassword')}</Title>
          <Form.Item name="currentPassword" label={t('profile.currentPassword')}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label={t('auth.newPassword')}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label={t('auth.confirmPassword')}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" onClick={handleChangePassword} loading={loading}>
            {t('profile.changePassword')}
          </Button>
        </Form>
      ),
    },
    {
      key: 'address',
      label: t('profile.address'),
      children: (
        <Form form={addressForm} layout="vertical" onFinish={handleUpdateAddress} style={{ maxWidth: 500 }}>
          <Form.Item name="street" label={t('profile.street')}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label={t('profile.city')}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label={t('profile.country')}>
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label={t('profile.postalCode')}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('profile.updateAddress')}
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('profile.title')}</Title>
        <Text type="secondary">{t('profile.subtitle')}</Text>
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
