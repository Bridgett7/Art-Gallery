import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Select, Space,
  message, Popconfirm, Card, Tag, Row, Col, Pagination, Switch, Upload
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { artworksApi, ArtworkData, CategoryData, CatalogueData } from '../api/artworks';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Meta } = Card;

export default function Artworks() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<ArtworkData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterArtist, setFilterArtist] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [previewImage, setPreviewImage] = useState<{url: string; title: string; artist?: string; year?: number; category?: string; catalogue?: string; description?: string; price?: number} | null>(null);
  const pageSize = 6;

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
    } catch { message.error(t('common.failed')); }
    finally { setLoading(false); }
  };

  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (value.trim()) {
      const res = await artworksApi.search(value);
      setArtworks(res.data);
    } else { loadData(); }
  };

  const handleAdd = () => { setEditingArtwork(null); form.resetFields(); setImageFile(null); setModalOpen(true); };

  const handleEdit = (artwork: ArtworkData) => {
    setEditingArtwork(artwork);
    setImageFile(null);
    form.setFieldsValue({
      title: artwork.title,
      description: artwork.description,
      year: artwork.year,
      categoryId: artwork.category?.id,
      catalogueId: artwork.catalogue?.id,
      forSale: artwork.forSale,
      price: artwork.price,
      stock: artwork.stock,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await artworksApi.delete(id);
    message.success(t('artworks.deleted'));
    loadData();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let artworkId: number;
      if (editingArtwork) {
        await artworksApi.update(editingArtwork.id, values);
        artworkId = editingArtwork.id;
        message.success(t('artworks.updated'));
      } else {
        const res = await artworksApi.create(values);
        artworkId = res.data.id;
        message.success(t('artworks.created'));
      }
      // Upload image if selected
      if (imageFile) {
        await artworksApi.uploadImage(artworkId, imageFile);
        message.success(t('artworks.imageUploaded'));
      }
      setModalOpen(false);
      setImageFile(null);
      setImageVersion(Date.now());
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
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('artworks.title')}</Title>
        <Text type="secondary">{artworks.length} artworks</Text>
      </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Input prefix={<SearchOutlined />} placeholder={t('artworks.search')} value={searchText}
            onChange={(e) => handleSearch(e.target.value)} style={{ width: 300 }} />
        </Col>
        <Col>
          {(user?.role === 'ARTIST' || user?.role === 'ADMIN') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>{t('artworks.addArtwork')}</Button>
          )}
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        <Col>
          <Select placeholder={t('artworks.allCategories')} allowClear style={{ width: 160 }}
            value={filterCategory} onChange={(v) => setFilterCategory(v)}>
            {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
          </Select>
        </Col>
        <Col>
          <Select placeholder={t('artworks.allArtists')} allowClear style={{ width: 160 }}
            value={filterArtist} onChange={(v) => setFilterArtist(v)}>
            {[...new Set(artworks.map(a => a.artist?.username).filter(Boolean))].map(name => (
              <Select.Option key={name} value={name}>{name}</Select.Option>
            ))}
          </Select>
        </Col>
        {(filterCategory || filterArtist) && (
          <Col><Button onClick={() => { setFilterCategory(null); setFilterArtist(null); }}>{t('orders.clear')}</Button></Col>
        )}
      </Row>

      <Row gutter={[20, 20]}>
        {artworks
          .filter(a => !filterCategory || a.category?.id === filterCategory)
          .filter(a => !filterArtist || a.artist?.username === filterArtist)
          .slice((currentPage - 1) * pageSize, currentPage * pageSize).map(artwork => (
          <Col xs={24} sm={12} md={8} lg={6} key={artwork.id}>
            <Card
              hoverable
              cover={
                artwork.hasImage ? (
                  <img
                    alt={artwork.title}
                    src={`/api/artworks/${artwork.id}/image?v=${imageVersion}`}
                    style={{ height: 180, objectFit: 'contain', background: '#fafafa', cursor: 'pointer' }}
                    onClick={() => setPreviewImage({
                      url: `/api/artworks/${artwork.id}/image?v=${imageVersion}`,
                      title: artwork.title,
                      artist: artwork.artist?.username,
                      year: artwork.year ?? undefined,
                      category: artwork.category?.name,
                      catalogue: artwork.catalogue?.name,
                      description: artwork.description,
                      price: artwork.price ?? undefined,
                    })}
                  />
                ) : (
                  <div style={{ height: 180, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  </div>
                )
              }
              actions={canEdit(artwork) ? [
                <EditOutlined key="edit" onClick={() => handleEdit(artwork)} />,
                <Popconfirm key="del" title={t('common.deleteConfirm')} onConfirm={() => handleDelete(artwork.id)}>
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
                  {artwork.forSale && <Tag color="green">🛒 {artwork.price} DT</Tag>}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {artworks.length > pageSize && (
        <Row justify="center" style={{ marginTop: 24 }}>
          <Pagination current={currentPage} pageSize={pageSize} total={artworks.length}
            onChange={(page) => setCurrentPage(page)} showSizeChanger={false} />
        </Row>
      )}

      {artworks.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary">{t('artworks.noArtworks')}</Text>
        </div>
      )}

      <Modal title={editingArtwork ? t('artworks.editArtwork') : t('artworks.addArtwork')} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editingArtwork ? t('common.update') : t('common.create')} width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label={t('common.title')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('artworks.description')}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="year" label={t('artworks.year')}><InputNumber style={{ width: '100%' }} min={1000} max={2100} /></Form.Item>
          <Form.Item name="categoryId" label={t('artworks.category')}>
            <Select placeholder={t('common.selectCategory')} allowClear>
              {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="catalogueId" label={t('artworks.catalogue')}>
            <Select placeholder={t('common.selectCatalogue')} allowClear>
              {catalogues.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label={t('artworks.image')}>
            <Upload
              beforeUpload={(file) => { setImageFile(file); return false; }}
              maxCount={1}
              accept="image/*"
              listType="picture"
              onRemove={() => setImageFile(null)}
            >
              <Button icon={<UploadOutlined />}>{t('artworks.selectImage')}</Button>
            </Upload>
            {editingArtwork?.hasImage && !imageFile && (
              <Text type="secondary" style={{ fontSize: 12 }}>{t('artworks.imageKept')}</Text>
            )}
          </Form.Item>
          <Form.Item name="forSale" label={t('artworks.forSale')} valuePropName="checked">
            <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.forSale !== cur.forSale}>
            {({ getFieldValue }) => getFieldValue('forSale') ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="price" label={t('artworks.price')} rules={[{ required: true, message: t('artworks.priceRequired') }]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stock" label={t('artworks.stock')} rules={[{ required: true, message: t('artworks.stockRequired') }]}>
                    <InputNumber style={{ width: '100%' }} min={1} />
                  </Form.Item>
                </Col>
              </Row>
            ) : null}
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        width="80%"
        centered
        styles={{ body: { padding: 0 } }}
      >
        {previewImage && (
          <Row gutter={0}>
            <Col span={16} style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <img src={previewImage.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            </Col>
            <Col span={8} style={{ padding: 24 }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Title level={4} style={{ margin: 0, color: '#2B3A67' }}>{previewImage.title}</Title>
                {previewImage.artist && (
                  <Text type="secondary">By <Text strong>{previewImage.artist}</Text></Text>
                )}
                {previewImage.year && <Tag>{previewImage.year}</Tag>}
                {previewImage.category && <Tag color="blue">{previewImage.category}</Tag>}
                {previewImage.catalogue && <Tag color="purple">{previewImage.catalogue}</Tag>}
                {previewImage.description && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('artworks.description')}</Text>
                    <Text type="secondary">{previewImage.description}</Text>
                  </div>
                )}
                {previewImage.price && (
                  <Text strong style={{ fontSize: 18, color: '#27AE60' }}>🛒 {previewImage.price} DT</Text>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
