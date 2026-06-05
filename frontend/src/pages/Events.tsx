import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Select, Space, DatePicker,
  message, Card, Tag, Row, Col, Switch, Tabs, Popconfirm, List, Pagination
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EnvironmentOutlined, TagOutlined } from '@ant-design/icons';
import { eventsApi, EventData } from '../api/events';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function Events() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
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
      message.error(t('common.failed'));
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
      message.success(`${t('events.ticketPurchased')} "${event.name}"!`);
      loadMyTickets();
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
    }
  };

  const handleViewEvent = async (event: EventData) => {
    try {
      const res = await eventsApi.getById(event.id);
      setSelectedEvent(res.data);
    } catch { setSelectedEvent(event); }
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
      message.success(t('events.deleted'));
      loadEvents();
    } catch (err: any) {
      message.error(err.response?.data?.error || t('common.failed'));
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
        message.success(t('events.updated'));
      } else {
        await eventsApi.create(data);
        message.success(t('events.created'));
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

  const translateStatus = (status: string) => {
    switch (status) {
      case 'DRAFT': return t('status.draft');
      case 'PUBLISHED': return t('status.published');
      case 'ONGOING': return t('status.ongoing');
      case 'COMPLETED': return t('status.completed');
      case 'CANCELLED': return t('status.cancelled');
      default: return status;
    }
  };

  const tabItems = [
    { key: 'all', label: t('events.all') },
    { key: 'upcoming', label: t('events.upcoming') },
    { key: 'ongoing', label: t('events.ongoing') },
    { key: 'tickets', label: `${t('events.myTickets')} (${myTickets.length})` },
  ];

  // Event Detail View
  if (selectedEvent) {
    return (
      <div>
        <Button onClick={() => setSelectedEvent(null)} style={{ marginBottom: 16 }}>← {t('events.backToList')}</Button>
        <Card style={{ borderRadius: 12 }}>
          <Row gutter={24}>
            <Col span={14}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                  <Title level={3} style={{ margin: 0, color: '#2B3A67' }}>{selectedEvent.name}</Title>
                  <Tag color={statusColor(selectedEvent.status)}>{translateStatus(selectedEvent.status)}</Tag>
                </Row>
                {selectedEvent.theme && <Text italic style={{ fontSize: 16 }}>{selectedEvent.theme}</Text>}
                {selectedEvent.description && <Text>{selectedEvent.description}</Text>}
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#f8f9fa' }}>
                      <Text strong>📍 {t('events.location')}</Text><br />
                      <Text>{selectedEvent.location || 'TBD'}</Text>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#f8f9fa' }}>
                      <Text strong>📅 {t('events.dates')}</Text><br />
                      <Text>{selectedEvent.startDate} → {selectedEvent.endDate}</Text>
                    </Card>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#f8f9fa' }}>
                      <Text strong>👥 {t('events.capacity')}</Text><br />
                      <Text>{selectedEvent.capacity || t('common.unlimited')}</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#f8f9fa' }}>
                      <Text strong>🎫 {t('events.visitorPrice')}</Text><br />
                      <Text>{selectedEvent.ticketPriceVisitor != null ? `${selectedEvent.ticketPriceVisitor} DT` : t('common.free')}</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#f8f9fa' }}>
                      <Text strong>🎨 {t('events.artistPrice')}</Text><br />
                      <Text>{selectedEvent.ticketPriceArtist != null ? `${selectedEvent.ticketPriceArtist} DT` : t('common.free')}</Text>
                    </Card>
                  </Col>
                </Row>
                {selectedEvent.openingHours && <Text>🕐 {t('events.openingHours')}: {selectedEvent.openingHours}</Text>}
                {(selectedEvent as any).ticketsSold != null && (
                  <Text type="secondary">{t('events.ticketsSold')}: {(selectedEvent as any).ticketsSold}</Text>
                )}
              </Space>
            </Col>
            <Col span={10}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {selectedEvent.hasImage && (
                  <img src={`/api/events/${selectedEvent.id}/image`} alt={selectedEvent.name}
                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 250 }} />
                )}
                {(selectedEvent.status === 'PUBLISHED' || selectedEvent.status === 'ONGOING') && (
                  <Button type="primary" block size="large" icon={<TagOutlined />}
                    onClick={() => handlePurchaseTicket(selectedEvent)}>
                    {t('events.buyTicket')} — {user?.role === 'ARTIST' ? selectedEvent.ticketPriceArtist : selectedEvent.ticketPriceVisitor} DT
                  </Button>
                )}
                {(selectedEvent as any).mapsLink && (
                  <Button block href={(selectedEvent as any).mapsLink} target="_blank">📍 {t('events.openMaps')}</Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('events.title')}</Title>
        <Text type="secondary">{t('events.subtitle')}</Text>
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} activeKey={filter} onChange={setFilter} centered />

      {/* Filter Bar */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Input
            placeholder={t('events.search')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </Col>
        <Col>
          {(user?.role === 'ADMIN' || user?.role === 'ARTIST') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('events.createExhibition')}
            </Button>
          )}
        </Col>
      </Row>

      {/* Events Grid or My Tickets */}
      {filter === 'tickets' ? (
        <div>
          {myTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Text type="secondary">{t('events.noTickets')}</Text>
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
                      <Text strong style={{ color: '#27AE60' }}>{t('events.paid')}: {ticket.price} DT</Text>
                      <img src={`/api/events/tickets/${ticket.id}/qr`} alt="QR Code"
                        style={{ width: 120, height: 120, marginTop: 8, border: '1px solid #eee', borderRadius: 4 }} />
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
                  onClick={() => handleViewEvent(event)}
                  actions={
                    (user?.role === 'ADMIN' || user?.role === 'ARTIST') ? [
                      <EditOutlined onClick={() => handleEdit(event)} />,
                      <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(event.id)}>
                        <DeleteOutlined />
                      </Popconfirm>,
                    ] : undefined
                  }
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Row justify="space-between">
                      <Tag color={statusColor(event.status)}>{translateStatus(event.status)}</Tag>
                      {event.featured && <Tag color="gold">⭐ {t('status.featured')}</Tag>}
                    </Row>
                    <Title level={5} style={{ margin: 0, color: '#2B3A67' }}>{event.name}</Title>
                    {event.theme && <Text type="secondary" italic>{event.theme}</Text>}
                    <Space>
                      <EnvironmentOutlined style={{ color: '#2B3A67' }} />
                      <Text>{event.location}</Text>
                    </Space>
                    <Text type="secondary">📅 {event.startDate} → {event.endDate}</Text>
                    {event.capacity && <Text type="secondary">👥 {t('events.capacity')}: {event.capacity}</Text>}
                    {event.ticketPriceVisitor != null && (
                      <Row justify="space-between" align="middle">
                        <Text strong style={{ color: '#27AE60', fontSize: 15 }}>🎫 From {event.ticketPriceVisitor} DT</Text>
                        {(event.status === 'PUBLISHED' || event.status === 'ONGOING') && (
                          <Button size="small" type="primary" icon={<TagOutlined />}
                            onClick={(e) => { e.stopPropagation(); handlePurchaseTicket(event); }}>
                            {t('events.buyTicket')}
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
              <Text type="secondary">{t('events.noExhibitions')}</Text>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingEvent ? t('events.editExhibition') : t('events.createExhibition')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingEvent ? t('common.update') : t('common.create')}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('events.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="theme" label={t('events.theme')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('events.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="location" label={t('events.location')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="openingHours" label={t('events.openingHours')}>
            <Input placeholder="e.g. 9:00 - 18:00" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label={t('events.startDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={t('events.endDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="capacity" label={t('events.capacity')}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ticketPriceVisitor" label={t('events.visitorPrice') + ' (DT)'}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ticketPriceArtist" label={t('events.artistPrice') + ' (DT)'}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label={t('events.status')}>
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
              <Form.Item name="featured" label={t('events.featured')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
