import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Select, Space,
  message, Popconfirm, Card, Tag, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, PictureOutlined } from '@ant-design/icons';
import { artworksApi, ArtworkData, CategoryData, CatalogueData } from '../api/artworks';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Meta } = Card;

export default function Artworks() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<ArtworkData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artRes, catRes, catalogRes] = await Promise.all([
        artworksApi.getAll(),
        artworksApi.getCategories(),
        artworksApi.getCatalogues(),
      ]);
      setArtworks(artRes.data);
      setCategories(catRes.data);
      setCatalogues(catalogRes.data);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (value.trim()) {
      const res = await artworksApi.search(value);
      setArtworks(res.data);
    } else { loadData(); }
  };

  const handleAdd = () => { setEditingArtwork(null); form.resetFields(); setModalOpen(true); };

  const handleEdit = (artwork: ArtworkData) => {
    setEditingArtwork(artwork);
    form.setFieldsValue({
      title: artwork.title,
      description: artwork.description,
      year: artwork.year,
      categoryId: artwork.category?.id,
      catalogueId: artwork.catalogue?.id,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await artworksApi.delete(id);
    message.success('Artwork deleted');
    loadData();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingArtwork) {
        await artworksApi.update(editingArtwork.id, values);
        message.success('Artwork updated');
      } else {
        await artworksApi.create(values);
        message.success('Artwork created');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      if (err.response?.data?.error) message.error(err.response.data.error);
    }
  };

  const canEdit = (artwork: ArtworkData) => {
    return user?.role === 'ADMIN' || artwork.artist?.idNumber === user?.userId;
  };

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>ARTWORKS</Title>
        <Text type="secondary">{artworks.length} artworks</Text>
      </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Input prefix={<SearchOutlined />} placeholder="Search artworks..." value={searchText}
            onChange={(e) => handleSearch(e.target.value)} style={{ width: 300 }} />
        </Col>
        <Col>
          {(user?.role === 'ARTIST' || user?.role === 'ADMIN') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Artwork</Button>
          )}
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        {artworks.map(artwork => (
          <Col xs={24} sm={12} md={8} lg={6} key={artwork.id}>
            <Card
              hoverable
              cover={
                artwork.hasImage ? (
                  <img alt={artwork.title} src={`/api/artworks/${artwork.id}/image`} style={{ height: 180, objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: 180, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  </div>
                )
              }
              actions={canEdit(artwork) ? [
                <EditOutlined key="edit" onClick={() => handleEdit(artwork)} />,
                <Popconfirm key="del" title="Delete?" onConfirm={() => handleDelete(artwork.id)}>
                  <DeleteOutlined />
                </Popconfirm>,
              ] : undefined}
            >
              <Meta
                title={artwork.title}
                description={artwork.artist?.username || 'Unknown artist'}
              />
              <div style={{ marginTop: 10 }}>
                <Space wrap>
                  {artwork.year && <Tag>{artwork.year}</Tag>}
                  {artwork.category && <Tag color="blue">{artwork.category.name}</Tag>}
                  {artwork.catalogue && <Tag color="purple">{artwork.catalogue.name}</Tag>}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {artworks.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary">No artworks found</Text>
        </div>
      )}

      <Modal title={editingArtwork ? 'Edit Artwork' : 'Add Artwork'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editingArtwork ? 'Update' : 'Create'} width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="year" label="Year"><InputNumber style={{ width: '100%' }} min={1000} max={2100} /></Form.Item>
          <Form.Item name="categoryId" label="Category">
            <Select placeholder="Select category" allowClear>
              {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="catalogueId" label="Catalogue">
            <Select placeholder="Select catalogue" allowClear>
              {catalogues.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
