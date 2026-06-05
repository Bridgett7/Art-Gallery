import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, Select, Space, DatePicker, Calendar,
  message, Card, Tag, Row, Col, Popconfirm, Badge, Tooltip
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { coursesApi, CourseData, PlanningData } from '../api/courses';
import { eventsApi, EventData } from '../api/events';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';

const { Title, Text } = Typography;

export default function Planning() {
  const { t, i18n } = useTranslation();

  // Set dayjs locale based on i18n language
  useEffect(() => {
    dayjs.locale(i18n.language === 'fr' ? 'fr' : 'en');
  }, [i18n.language]);
  const [planning, setPlanning] = useState<PlanningData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [planRes, courseRes, eventRes] = await Promise.all([
        coursesApi.getPlanning(),
        coursesApi.getAll(),
        eventsApi.getAll(),
      ]);
      setPlanning(planRes.data);
      setCourses(courseRes.data);
      setEvents(eventRes.data);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleAdd = () => { form.resetFields(); setModalOpen(true); };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      courseId: values.courseId,
      startTime: values.startTime?.format('YYYY-MM-DDTHH:mm:ss'),
      endTime: values.endTime?.format('YYYY-MM-DDTHH:mm:ss'),
      room: values.room,
      status: values.status || 'SCHEDULED',
      notes: values.notes,
    };
    try {
      await coursesApi.createPlanning(data);
      message.success('Lesson scheduled');
      setModalOpen(false);
      loadData();
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id: number) => {
    await coursesApi.deletePlanning(id);
    message.success('Deleted');
    loadData();
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case 'SCHEDULED': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const badgeStatus = (s: string | null): 'processing' | 'success' | 'error' | 'default' => {
    switch (s) {
      case 'SCHEDULED': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // Get planning items for a specific date
  const getPlanningForDate = (date: Dayjs) => {
    return planning.filter(item => {
      if (!item.startTime) return false;
      return dayjs(item.startTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });
  };

  // Get events for a specific date (events span multiple days)
  const getEventsForDate = (date: Dayjs) => {
    return events.filter(event => {
      if (!event.startDate || !event.endDate) return false;
      const start = dayjs(event.startDate);
      const end = dayjs(event.endDate);
      return !date.isBefore(start, 'day') && !date.isAfter(end, 'day');
    });
  };

  // Calendar cell renderer
  const dateCellRender = (date: Dayjs) => {
    const items = getPlanningForDate(date);
    const dayEvents = getEventsForDate(date);
    if (items.length === 0 && dayEvents.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.slice(0, 2).map(event => (
          <li key={`ev-${event.id}`} style={{ marginBottom: 2 }}>
            <Tooltip title={`${event.name} — ${event.location || ''}`}>
              <Badge
                status="warning"
                text={<Text style={{ fontSize: 11, color: '#D4880F' }} ellipsis>🎨 {event.name}</Text>}
              />
            </Tooltip>
          </li>
        ))}
        {items.slice(0, 3 - Math.min(dayEvents.length, 2)).map(item => (
          <li key={item.id} style={{ marginBottom: 2 }}>
            <Tooltip title={`${item.course || 'Course'} — ${item.room || ''} (${dayjs(item.startTime).format('HH:mm')})`}>
              <Badge
                status={badgeStatus(item.status)}
                text={<Text style={{ fontSize: 11 }} ellipsis>{item.course || 'Lesson'}{item.createdBy ? ` by ${item.createdBy}` : ''}</Text>}
              />
            </Tooltip>
          </li>
        ))}
        {(items.length + dayEvents.length) > 3 && (
          <li><Text type="secondary" style={{ fontSize: 11 }}>+{items.length + dayEvents.length - 3} more</Text></li>
        )}
      </ul>
    );
  };

  // Handle date click to show day details
  const handleDateSelect = (date: Dayjs) => {
    const items = getPlanningForDate(date);
    const dayEvents = getEventsForDate(date);
    if (items.length > 0 || dayEvents.length > 0) {
      setSelectedDate(date);
      setDayModalOpen(true);
    }
  };

  const selectedDayItems = selectedDate ? getPlanningForDate(selectedDate) : [];
  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('planning.title')}</Title>
        <Text type="secondary">{planning.length} {t('planning.scheduledLessons')}</Text>
      </div>

      <Row justify="end" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>{t('planning.scheduleLesson')}</Button>
      </Row>

      {/* Calendar View */}
      <Card style={{ borderRadius: 12 }}>
        <Calendar
          cellRender={(date, info) => {
            if (info.type === 'date') return dateCellRender(date);
            return null;
          }}
          onSelect={handleDateSelect}
        />
      </Card>

      <Modal
        title={selectedDate ? `Schedule — ${selectedDate.format('MMMM DD, YYYY')}` : 'Schedule'}
        open={dayModalOpen}
        onCancel={() => setDayModalOpen(false)}
        footer={null}
        width={550}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {/* Events */}
          {selectedDayEvents.map(event => (
            <Card key={`ev-${event.id}`} size="small" style={{ borderRadius: 8, borderLeft: '4px solid #F5A623' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <Text strong>🎨 {event.name}</Text>
                      <Tag color="gold">{event.status}</Tag>
                    </Space>
                    {event.theme && <Text type="secondary">{event.theme}</Text>}
                    <Text type="secondary">
                      � {event.location || 'No location'}
                      {' | '}📅 {event.startDate} → {event.endDate}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
          {/* Lessons */}
          {selectedDayItems.map(item => (
            <Card key={item.id} size="small" style={{ borderRadius: 8, borderLeft: '4px solid #2B3A67' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <Text strong>{item.course || 'No course'}</Text>
                      <Tag color={statusColor(item.status)}>{item.status}</Tag>
                    </Space>
                    {item.lesson && <Text type="secondary">Lesson: {item.lesson}</Text>}
                    <Text type="secondary">
                      🕐 {item.startTime ? dayjs(item.startTime).format('HH:mm') : '—'}
                      {item.endTime ? ` → ${dayjs(item.endTime).format('HH:mm')}` : ''}
                      {item.room ? ` | 📍 ${item.room}` : ''}
                    </Text>
                    {item.createdBy && <Text type="secondary">👤 {item.createdBy}</Text>}
                    {item.notes && <Text type="secondary" italic>{item.notes}</Text>}
                  </Space>
                </Col>
                <Col>
                  <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => { handleDelete(item.id); setDayModalOpen(false); }}>
                    <Button icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                </Col>
              </Row>
            </Card>
          ))}
          {selectedDayItems.length === 0 && selectedDayEvents.length === 0 && (
            <Text type="secondary">{t('planning.nothingScheduled')}</Text>
          )}
        </Space>
      </Modal>

      {/* Schedule Lesson Modal */}
      <Modal title={t('planning.scheduleLesson')} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={t('planning.schedule')} cancelText={t('common.cancel')}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="courseId" label={t('planning.course')} rules={[{ required: true }]}>
            <Select placeholder={t('planning.selectCourse')}>
              {courses.map(c => <Select.Option key={c.id} value={c.id}>{c.title}</Select.Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label={t('planning.startTime')} rules={[{ required: true }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label={t('planning.endTime')} rules={[{ required: true }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="room" label={t('planning.room')}><Input placeholder={t('planning.roomPlaceholder')} /></Form.Item>
          <Form.Item name="status" label={t('planning.status')} initialValue="SCHEDULED">
            <Select>
              <Select.Option value="SCHEDULED">{t('planning.scheduled')}</Select.Option>
              <Select.Option value="COMPLETED">{t('planning.completed')}</Select.Option>
              <Select.Option value="CANCELLED">{t('planning.cancelled')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label={t('planning.notes')}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
