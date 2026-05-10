import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Form, Input, Space, message, Card, List, Divider, Row, Col
} from 'antd';
import { PlusOutlined, CommentOutlined, MessageOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Forum() {
  const [posts, setPosts] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [postForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [discussionForm] = Form.useForm();
  const [messageForm] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [postRes, discRes] = await Promise.all([
      api.get('/forum/posts'),
      api.get('/forum/discussions'),
    ]);
    setPosts(postRes.data);
    setDiscussions(discRes.data);
  };

  const handleSelectPost = async (post: any) => {
    setSelectedPost(post);
    const res = await api.get(`/forum/posts/${post.id}/comments`);
    setComments(res.data);
  };

  const handleSelectDiscussion = async (disc: any) => {
    setSelectedDiscussion(disc);
    const res = await api.get(`/forum/discussions/${disc.id}/messages`);
    setMessages(res.data);
  };

  const handleCreatePost = async (values: any) => {
    await api.post('/forum/posts', values);
    message.success('Post created');
    postForm.resetFields();
    loadData();
  };

  const handleAddComment = async (values: any) => {
    if (!selectedPost) return;
    await api.post(`/forum/posts/${selectedPost.id}/comments`, values);
    message.success('Comment added');
    commentForm.resetFields();
    handleSelectPost(selectedPost);
  };

  const handleCreateDiscussion = async (values: any) => {
    await api.post('/forum/discussions', values);
    message.success('Discussion created');
    discussionForm.resetFields();
    loadData();
  };

  const handleSendMessage = async (values: any) => {
    if (!selectedDiscussion) return;
    await api.post(`/forum/discussions/${selectedDiscussion.id}/messages`, values);
    message.success('Message sent');
    messageForm.resetFields();
    handleSelectDiscussion(selectedDiscussion);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={2}>FORUM</Title>
        <Text type="secondary">Community discussions and posts</Text>
      </div>

      {/* Posts Section */}
      <Card title="📝 Posts" style={{ marginBottom: 24 }}>
        <Row gutter={20}>
          <Col span={12}>
            <Text strong>All Posts</Text>
            <List
              style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
              dataSource={posts}
              renderItem={(post: any) => (
                <List.Item
                  onClick={() => handleSelectPost(post)}
                  style={{ cursor: 'pointer', background: selectedPost?.id === post.id ? '#f0f5ff' : undefined, padding: '8px 12px' }}
                >
                  <List.Item.Meta title={post.title} description={`by ${post.user}`} />
                </List.Item>
              )}
            />
          </Col>
          <Col span={12}>
            <Text strong>Comments</Text>
            {selectedPost ? (
              <>
                <List
                  style={{ marginTop: 8, maxHeight: 150, overflow: 'auto' }}
                  dataSource={comments}
                  renderItem={(c: any) => (
                    <List.Item><Text strong>{c.user}:</Text> {c.content}</List.Item>
                  )}
                  locale={{ emptyText: 'No comments' }}
                />
                <Form form={commentForm} onFinish={handleAddComment} layout="inline" style={{ marginTop: 8 }}>
                  <Form.Item name="content" style={{ flex: 1 }}>
                    <Input placeholder="Write a comment..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Add</Button>
                </Form>
              </>
            ) : <Text type="secondary">Select a post</Text>}
          </Col>
        </Row>
        <Divider />
        <Text strong>Create New Post</Text>
        <Form form={postForm} onFinish={handleCreatePost} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="Post title..." /></Form.Item>
          <Form.Item name="content"><TextArea rows={2} placeholder="Post content..." /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Create Post</Button>
        </Form>
      </Card>

      {/* Discussions Section */}
      <Card title="💬 Discussions">
        <Row gutter={20}>
          <Col span={12}>
            <Text strong>All Discussions</Text>
            <List
              style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
              dataSource={discussions}
              renderItem={(disc: any) => (
                <List.Item
                  onClick={() => handleSelectDiscussion(disc)}
                  style={{ cursor: 'pointer', background: selectedDiscussion?.id === disc.id ? '#f0f5ff' : undefined, padding: '8px 12px' }}
                >
                  <List.Item.Meta title={disc.title} description={`by ${disc.user}`} />
                </List.Item>
              )}
            />
          </Col>
          <Col span={12}>
            <Text strong>Messages</Text>
            {selectedDiscussion ? (
              <>
                <List
                  style={{ marginTop: 8, maxHeight: 150, overflow: 'auto' }}
                  dataSource={messages}
                  renderItem={(m: any) => (
                    <List.Item><Text strong>{m.sender}:</Text> {m.content}</List.Item>
                  )}
                  locale={{ emptyText: 'No messages' }}
                />
                <Form form={messageForm} onFinish={handleSendMessage} layout="inline" style={{ marginTop: 8 }}>
                  <Form.Item name="content" style={{ flex: 1 }}>
                    <Input placeholder="Write a message..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Send</Button>
                </Form>
              </>
            ) : <Text type="secondary">Select a discussion</Text>}
          </Col>
        </Row>
        <Divider />
        <Text strong>Create New Discussion</Text>
        <Form form={discussionForm} onFinish={handleCreateDiscussion} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="Discussion title..." /></Form.Item>
          <Form.Item name="description"><TextArea rows={2} placeholder="Description..." /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Create Discussion</Button>
        </Form>
      </Card>
    </div>
  );
}
