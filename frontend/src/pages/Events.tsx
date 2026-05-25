import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Select, Space, DatePicker,
  message, Card, Tag, Row, Col, Switch, Tabs, Popconfirm, List, Pagination
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EnvironmentOutlined, TagOutlined } from '@ant-design/icons';
import { eventsApi, EventData } from '../api/events';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();
  const pageSize = 6;

  useEffect(() => {
    loadEvents();
    loadMyTickets();
  }, [filter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let res;
      switch (filter) {
        case 'upcoming': res = await eventsApi.getUpcoming(); break;
        case 'ongoing': res = await eventsApi.getOngoing(); break;
        default: res = await eventsApi.getAll();
      }
      setEvents(res.data);
    } catch (err) {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadMyTickets = async () => {
    try {
      const res = await eventsApi.getMyTickets();
      setMyTickets(res.data);
    } catch { /* ignore */ }
  };

  const handlePurchaseTicket = async (event: EventData) => {
    const ticketType = user?.role === 'ARTIST' ? 'ARTIST' : 'VISITOR';
    try {
      await eventsApi.purchaseTicket(event.id, ticketType);
      message.success(`Ticket purchased for "${event.name}"!`);
      loadMyTickets();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to purchase ticket');
    }
  };

  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (value.trim()) {
      try {
        const res = await eventsApi.search(value);
        setEvents(res.data);
      } catch { /* ignore */ }
    } else {
      loadEvents();
    }
  };

  const handleAdd = () => {
    setEditingEvent(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (event: EventData) => {
    setEditingEvent(event);
    form.setFieldsValue({
      ...event,
      startDate: event.startDate ? dayjs(event.startDate) : null,
      endDate: event.endDate ? dayjs(event.endDate) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await eventsApi.delete(id);
      message.success('Event deleted');
      loadEvents();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };

      if (editingEvent) {
        await eventsApi.update(editingEvent.id, data);
        message.success('Event updated');
      } else {
        await eventsApi.create(data);
        message.success('Event created');
      }
      setModalOpen(false);
      loadEvents();
    } catch (err: any) {
      if (err.response?.data?.error) {
        message.error(err.response.data.error);
      }
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PUBLISHED': return 'blue';
      case 'ONGOING': return 'green';
      case 'COMPLETED': return 'orange';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const tabItems = [
    { key: 'all', label: 'All Exhibitions' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'tickets', label: `My Tickets (${myTickets.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>EXHIBITIONS</Title>
        <Text type="secondary">Discover our curated art exhibitions and events</Text>
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} activeKey={filter} onChange={setFilter} centered />

      {/* Filter Bar */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Input
            placeholder="Search exhibitions..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </Col>
        <Col>
          {(user?.role === 'ADMIN' || user?.role === 'ARTIST') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Create Exhibition
            </Button>
          )}
        </Col>
      </Row>

      {/* Events Grid or My Tickets */}
      {filter === 'tickets' ? (
        <div>
          {myTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Text type="secondary">No tickets purchased yet</Text>
            </div>
          ) : (
            <Row gutter={[20, 20]}>
              {myTickets.map((ticket: any) => (
                <Col xs={24} md={12} lg={8} key={ticket.id}>
                  <Card style={{ borderRadius: 12 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Tag color="purple">🎫 {ticket.ticketType}</Tag>
                      <Title level={5} style={{ margin: 0, color: '#2B3A67' }}>{ticket.event?.name}</Title>
                      <Space>
                        <EnvironmentOutlined style={{ color: '#2B3A67' }} />
                        <Text>{ticket.event?.location}</Text>
                      </Space>
                      <Text type="secondary">📅 {ticket.event?.startDate} → {ticket.event?.endDate}</Text>
                      <Text strong style={{ color: '#27AE60' }}>Paid: {ticket.price} DT</Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {events.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(event => (
              <Col xs={24} md={12} lg={8} key={event.id}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  actions={
                    (user?.role === 'ADMIN' || user?.role === 'ARTIST') ? [
                      <EditOutlined onClick={() => handleEdit(event)} />,
                      <Popconfirm title="Delete?" onConfirm={() => handleDelete(event.id)}>
                        <DeleteOutlined />
                      </Popconfirm>,
                    ] : undefined
                  }
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Row justify="space-between">
                      <Tag color={statusColor(event.status)}>{event.status}</Tag>
                      {event.featured && <Tag color="gold">⭐ FEATURED</Tag>}
                    </Row>
                    <Title level={5} style={{ margin: 0, color: '#2B3A67' }}>{event.name}</Title>
                    {event.theme && <Text type="secondary" italic>{event.theme}</Text>}
                    <Space>
                      <EnvironmentOutlined style={{ color: '#2B3A67' }} />
                      <Text>{event.location}</Text>
                    </Space>
                    <Text type="secondary">📅 {event.startDate} → {event.endDate}</Text>
                    {event.capacity && <Text type="secondary">👥 Capacity: {event.capacity}</Text>}
                    {event.ticketPriceVisitor != null && (
                      <Row justify="space-between" align="middle">
                        <Text strong style={{ color: '#27AE60', fontSize: 15 }}>🎫 From {event.ticketPriceVisitor} DT</Text>
                        {(event.status === 'PUBLISHED' || event.status === 'ONGOING') && (
                          <Button size="small" type="primary" icon={<TagOutlined />}
                            onClick={(e) => { e.stopPropagation(); handlePurchaseTicket(event); }}>
                            Buy Ticket
                          </Button>
                        )}
                      </Row>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {events.length > pageSize && (
            <Row justify="center" style={{ marginTop: 24 }}>
              <Pagination current={currentPage} pageSize={pageSize} total={events.length}
                onChange={(page) => setCurrentPage(page)} showSizeChanger={false} />
            </Row>
          )}

          {events.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Text type="secondary">No exhibitions found</Text>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingEvent ? 'Edit Exhibition' : 'Create Exhibition'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingEvent ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="theme" label="Theme" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="openingHours" label="Opening Hours">
            <Input placeholder="e.g. 9:00 - 18:00" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="capacity" label="Capacity">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ticketPriceVisitor" label="Visitor Price (DT)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ticketPriceArtist" label="Artist Price (DT)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="DRAFT">Draft</Select.Option>
                  <Select.Option value="PUBLISHED">Published</Select.Option>
                  <Select.Option value="ONGOING">Ongoing</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                  <Select.Option value="CANCELLED">Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="featured" label="Featured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
