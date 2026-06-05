import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, Select, Space, message,
  Popconfirm, Tag, Card, Row, Col, Avatar, Input as AntInput
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usersApi, UserData } from '../api/users';

const { Title, Text } = Typography;

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch { message.error(t('common.failed')); }
    finally { setLoading(false); }
  };

  const applyFilters = (search: string, role: string | null) => {
    let result = [...users];
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(u =>
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.idNumber.toLowerCase().includes(s)
      );
    }
    if (role) result = result.filter(u => u.role === role);
    setFilteredUsers(result);
  };

  const handleSearch = (value: string) => { setSearchText(value); applyFilters(value, roleFilter); };
  const handleRoleFilter = (value: string | null) => { setRoleFilter(value); applyFilters(searchText, value); };
  const handleAdd = () => { setEditingUser(null); form.resetFields(); setModalOpen(true); };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    form.setFieldsValue({ idNumber: user.idNumber, username: user.username, email: user.email, role: user.role, password: '' });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      message.success(t('users.deleted'));
      loadUsers();
    } catch (err: any) { message.error(err.response?.data?.error || t('common.failed')); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const updateData: any = { username: values.username, email: values.email, role: values.role };
        if (values.password) updateData.password = values.password;
        await usersApi.update(editingUser.idNumber, updateData);
        message.success(t('users.updated'));
      } else {
        await usersApi.create(values);
        message.success(t('users.created'));
      }
      setModalOpen(false);
      loadUsers();
    } catch (err: any) {
      if (err.response?.data?.error) message.error(err.response.data.error);
    }
  };

  const roleColor = (role: string) => {
    switch (role) { case 'ADMIN': return 'red'; case 'ARTIST': return 'blue'; case 'VISITOR': return 'green'; default: return 'default'; }
  };

  const roleIcon = (role: string) => {
    switch (role) { case 'ADMIN': return '👑'; case 'ARTIST': return '🎨'; case 'VISITOR': return '👤'; default: return ''; }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('users.title')}</Title>
        <Text type="secondary">{filteredUsers.length} {t('nav.users').toLowerCase()}</Text>
      </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Space>
            <Input prefix={<SearchOutlined />} placeholder={t('users.search')}
              value={searchText} onChange={(e) => handleSearch(e.target.value)} style={{ width: 300 }} />
            <Select value={roleFilter} onChange={handleRoleFilter} placeholder={t('users.allRoles')}
              allowClear style={{ width: 140 }}>
              <Select.Option value="ADMIN">{t('users.admin')}</Select.Option>
              <Select.Option value="ARTIST">{t('users.artist')}</Select.Option>
              <Select.Option value="VISITOR">{t('users.visitor')}</Select.Option>
            </Select>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>{t('users.addUser')}</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {filteredUsers.map(u => (
          <Col xs={24} sm={12} lg={8} key={u.idNumber}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Row align="middle" gutter={16}>
                <Col>
                  <Avatar size={50} icon={<UserOutlined />} style={{
                    background: u.role === 'ADMIN' ? '#ff4d4f' : u.role === 'ARTIST' ? '#1890ff' : '#52c41a'
                  }} />
                </Col>
                <Col flex="auto">
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Space>
                      <Text strong>{u.username}</Text>
                      <Tag color={roleColor(u.role)}>{roleIcon(u.role)} {u.role}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{u.email}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>ID: {u.idNumber}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" size={4}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(u)} block>{t('common.edit')}</Button>
                    <Popconfirm title={t('users.deleteConfirm')} onConfirm={() => handleDelete(u.idNumber)}>
                      <Button icon={<DeleteOutlined />} size="small" danger block>{t('common.delete')}</Button>
                    </Popconfirm>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredUsers.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary">{t('users.noUsers')}</Text>
        </div>
      )}

      <Modal title={editingUser ? t('users.editUser') : t('users.addUser')} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)}
        okText={editingUser ? t('common.update') : t('common.create')} cancelText={t('common.cancel')}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="idNumber" label={t('users.id')} rules={[{ required: !editingUser, message: t('users.idRequired') }]}>
            <Input placeholder={t('users.idPlaceholder')} disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="username" label={t('auth.username')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('auth.email')} rules={[{ required: true }, { type: 'email', message: t('auth.invalidEmail') }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="password" label={editingUser ? t('users.passwordKeep') : t('auth.password')}
            rules={editingUser ? [] : [{ required: true }]}>
            <Input.Password placeholder={t('users.minChars')} />
          </Form.Item>
          <Form.Item name="role" label={t('auth.role')} rules={[{ required: true }]}>
            <Select placeholder={t('users.selectRole')}>
              <Select.Option value="ADMIN">👑 {t('users.admin')}</Select.Option>
              <Select.Option value="ARTIST">🎨 {t('users.artist')}</Select.Option>
              <Select.Option value="VISITOR">👤 {t('users.visitor')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
