import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Select, Space,
  message, Card, Tag, Row, Col, Popconfirm, Tabs, Drawer, List, Empty
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import { coursesApi, CourseData, LessonData } from '../api/courses';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Courses() {
  const { user } = useAuth();
  const isArtistOrAdmin = user?.role === 'ARTIST' || user?.role === 'ADMIN';

  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [myCourses, setMyCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [searchAll, setSearchAll] = useState('');
  const [searchMy, setSearchMy] = useState('');
  const [form] = Form.useForm();

  // Drawer for lessons
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonForm] = Form.useForm();

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesApi.getAll();
      setAllCourses(res.data);
      if (isArtistOrAdmin) {
        setMyCourses(res.data.filter(c => c.artistId === user?.userId));
      }
    } catch { message.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const handleSearchAll = async (value: string) => {
    setSearchAll(value);
    if (value.trim()) {
      const res = await coursesApi.search(value);
      setAllCourses(res.data);
    } else { loadCourses(); }
  };

  const handleSearchMy = async (value: string) => {
    setSearchMy(value);
    if (value.trim()) {
      const res = await coursesApi.search(value);
      setMyCourses(res.data.filter(c => c.artistId === user?.userId));
    } else { loadCourses(); }
  };

  const handleAdd = () => { setEditingCourse(null); form.resetFields(); setModalOpen(true); };

  const handleEdit = (c: CourseData) => {
    setEditingCourse(c);
    form.setFieldsValue(c);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await coursesApi.delete(id);
    message.success('Course deleted');
    loadCourses();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse.id, values);
        message.success('Course updated');
      } else {
        await coursesApi.create(values);
        message.success('Course created');
      }
      setModalOpen(false);
      loadCourses();
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  // --- Lessons Drawer ---
  const openLessons = async (course: CourseData) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
    try {
      const res = await coursesApi.getLessons(course.id);
      setLessons(res.data);
    } catch { message.error('Failed to load lessons'); }
  };

  const handleAddLesson = () => { lessonForm.resetFields(); setLessonModalOpen(true); };

  const handleLessonSubmit = async () => {
    if (!selectedCourse) return;
    const values = await lessonForm.validateFields();
    try {
      await coursesApi.createLesson(selectedCourse.id, values);
      message.success('Lesson added');
      setLessonModalOpen(false);
      const res = await coursesApi.getLessons(selectedCourse.id);
      setLessons(res.data);
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!selectedCourse) return;
    await coursesApi.deleteLesson(id);
    message.success('Lesson deleted');
    const res = await coursesApi.getLessons(selectedCourse.id);
    setLessons(res.data);
  };

  const levelColor = (level: string | null) => {
    switch (level) {
      case 'BEGINNER': return 'green';
      case 'INTERMEDIATE': return 'orange';
      case 'ADVANCED': return 'red';
      default: return 'default';
    }
  };

  const renderCourseCard = (course: CourseData, isOwner: boolean) => (
    <Col xs={24} sm={12} lg={8} key={course.id}>
      <Card
        hoverable
        onClick={() => openLessons(course)}
        actions={isOwner ? [
          <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(course); }} />,
          <Popconfirm key="del" title="Delete?" onConfirm={() => handleDelete(course.id)}
            onPopupClick={(e) => e?.stopPropagation()}>
            <DeleteOutlined onClick={(e) => e.stopPropagation()} />
          </Popconfirm>,
        ] : [
          <BookOutlined key="view" />,
        ]}
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Row justify="space-between">
            <Title level={5} style={{ margin: 0 }}>{course.title}</Title>
            <Tag color={levelColor(course.level)}>{course.level || 'N/A'}</Tag>
          </Row>
          <Text type="secondary">{course.description || 'No description'}</Text>
          <Row justify="space-between" style={{ marginTop: 8 }}>
            {course.duration && <Text>⏱ {course.duration}h</Text>}
            {course.price != null && <Text strong style={{ color: '#27AE60' }}>{course.price} DT</Text>}
          </Row>
        </Space>
      </Card>
    </Col>
  );

  const tabItems = isArtistOrAdmin ? [
    {
      key: 'all',
      label: 'All Courses',
      children: (
        <div>
          <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Col>
              <Input prefix={<SearchOutlined />} placeholder="Search courses..." value={searchAll}
                onChange={(e) => handleSearchAll(e.target.value)} style={{ width: 300 }} />
            </Col>
          </Row>
          <Row gutter={[20, 20]}>
            {allCourses.map(c => renderCourseCard(c, c.artistId === user?.userId))}
          </Row>
          {allCourses.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60 }}><Text type="secondary">No courses found</Text></div>
          )}
        </div>
      ),
    },
    {
      key: 'my',
      label: 'My Courses',
      children: (
        <div>
          <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Col>
              <Input prefix={<SearchOutlined />} placeholder="Search my courses..." value={searchMy}
                onChange={(e) => handleSearchMy(e.target.value)} style={{ width: 300 }} />
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Course</Button>
            </Col>
          </Row>
          <Row gutter={[20, 20]}>
            {myCourses.map(c => renderCourseCard(c, true))}
          </Row>
          {myCourses.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60 }}><Text type="secondary">No courses yet</Text></div>
          )}
        </div>
      ),
    },
  ] : undefined;

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>COURSES</Title>
        <Text type="secondary">Explore and manage art courses</Text>
      </div>

      {isArtistOrAdmin ? (
        <Tabs items={tabItems} centered />
      ) : (
        <div>
          <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Col>
              <Input prefix={<SearchOutlined />} placeholder="Search courses..." value={searchAll}
                onChange={(e) => handleSearchAll(e.target.value)} style={{ width: 300 }} />
            </Col>
          </Row>
          <Row gutter={[20, 20]}>
            {allCourses.map(c => renderCourseCard(c, false))}
          </Row>
          {allCourses.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60 }}><Text type="secondary">No courses found</Text></div>
          )}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      <Modal title={editingCourse ? 'Edit Course' : 'Add Course'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editingCourse ? 'Update' : 'Create'}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="level" label="Level">
            <Select placeholder="Select level" allowClear>
              <Select.Option value="BEGINNER">Beginner</Select.Option>
              <Select.Option value="INTERMEDIATE">Intermediate</Select.Option>
              <Select.Option value="ADVANCED">Advanced</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (hours)"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="Price (DT)"><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Lessons Drawer */}
      <Drawer
        title={selectedCourse ? `Lessons — ${selectedCourse.title}` : 'Lessons'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        extra={isArtistOrAdmin && selectedCourse?.artistId === user?.userId && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLesson}>Add Lesson</Button>
        )}
      >
        {lessons.length === 0 ? (
          <Empty description="No lessons yet" />
        ) : (
          <List
            dataSource={lessons}
            renderItem={(lesson, index) => (
              <List.Item
                actions={isArtistOrAdmin && selectedCourse?.artistId === user?.userId ? [
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteLesson(lesson.id)}>
                    <Button icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                ] : undefined}
              >
                <List.Item.Meta
                  avatar={<Tag color="#2B3A67">{lesson.lessonOrder ?? index + 1}</Tag>}
                  title={lesson.title}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">{lesson.description || 'No description'}</Text>
                      <Space size={12}>
                        {lesson.level && <Tag color={levelColor(lesson.level)}>{lesson.level}</Tag>}
                        {lesson.duration && <Text type="secondary">⏱ {lesson.duration} min</Text>}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* Add Lesson Modal */}
      <Modal title="Add Lesson" open={lessonModalOpen}
        onOk={handleLessonSubmit} onCancel={() => setLessonModalOpen(false)} okText="Add">
        <Form form={lessonForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lessonOrder" label="Order"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="duration" label="Duration (min)"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="level" label="Level">
                <Select placeholder="Level" allowClear>
                  <Select.Option value="BEGINNER">Beginner</Select.Option>
                  <Select.Option value="INTERMEDIATE">Intermediate</Select.Option>
                  <Select.Option value="ADVANCED">Advanced</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
