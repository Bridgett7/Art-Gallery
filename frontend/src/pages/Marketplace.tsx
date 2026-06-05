import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, InputNumber, Space,
  message, Card, Row, Col, Popconfirm, Tag, Tabs, Pagination, Upload
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ShoppingCartOutlined, UploadOutlined } from '@ant-design/icons';
import { productsApi, ProductData } from '../api/products';
import { ordersApi } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Meta } = Card;

export default function Marketplace() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [myProducts, setMyProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [searchAll, setSearchAll] = useState('');
  const [searchMy, setSearchMy] = useState('');
  const [pageAll, setPageAll] = useState(1);
  const [pageMy, setPageMy] = useState(1);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [previewImage, setPreviewImage] = useState<{url: string; name: string; description?: string; price?: number; stock?: number} | null>(null);
  const pageSize = 6;

  const isArtist = user?.role === 'ARTIST' || user?.role === 'ADMIN';

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll();
      setAllProducts(res.data);
      if (isArtist) setMyProducts(res.data);
    } catch { message.error(t('common.failed')); }
    finally { setLoading(false); }
  };

  const handleSearchAll = async (value: string) => {
    setSearchAll(value);
    if (value.trim()) {
      const res = await productsApi.search(value);
      setAllProducts(res.data);
    } else { loadProducts(); }
  };

  const handleSearchMy = async (value: string) => {
    setSearchMy(value);
    if (value.trim()) {
      const res = await productsApi.search(value);
      setMyProducts(res.data);
    } else { loadProducts(); }
  };

  const handleAdd = () => { setEditingProduct(null); form.resetFields(); setImageFile(null); setModalOpen(true); };

  const handleEdit = (product: ProductData) => {
    setEditingProduct(product);
    setImageFile(null);
    form.setFieldsValue(product);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await productsApi.delete(id);
    message.success(t('marketplace.deleted'));
    loadProducts();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      let productId: number;
      if (editingProduct) {
        await productsApi.update(editingProduct.id, values);
        productId = editingProduct.id;
        message.success(t('marketplace.updated'));
      } else {
        const res = await productsApi.create(values);
        productId = res.data.id;
        message.success(t('marketplace.created'));
      }
      if (imageFile) {
        await productsApi.uploadImage(productId, imageFile);
        message.success(t('marketplace.imageUploaded'));
      }
      setModalOpen(false);
      setImageFile(null);
      setImageVersion(Date.now());
      loadProducts();
    } catch (err: any) { message.error(err.response?.data?.error || t('common.failed')); }
  };

  const handleAddToCart = async (product: ProductData) => {
    try {
      const activeRes = await ordersApi.getActive();
      let orderId: number;
      if (activeRes.data.id) {
        orderId = activeRes.data.id;
      } else {
        const newOrder = await ordersApi.create('');
        orderId = newOrder.data.id;
      }
      await ordersApi.addItem(orderId, product.id, 1);
      message.success(`${product.name} ${t('marketplace.addedToCart')}`);
    } catch (err: any) { message.error(err.response?.data?.error || t('common.failed')); }
  };

  const renderProductCard = (product: ProductData, isOwner: boolean) => (
    <Col xs={24} sm={12} md={8} key={product.id}>
      <Card
        hoverable
        cover={
          product.hasImage ? (
            <img
              alt={product.name}
              src={`/api/products/${product.id}/image?v=${imageVersion}`}
              style={{ height: 200, objectFit: 'contain', background: '#fafafa', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setPreviewImage({
                url: `/api/products/${product.id}/image?v=${imageVersion}`,
                name: product.name,
                description: product.description,
                price: product.price ?? undefined,
                stock: product.stock ?? undefined,
              }); }}
            />
          ) : (
            <div style={{ height: 200, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCartOutlined style={{ fontSize: 48, color: '#ccc' }} />
            </div>
          )
        }
        actions={[
          ...(isOwner ? [
            <EditOutlined key="edit" onClick={() => handleEdit(product)} />,
            <Popconfirm key="del" title={t('common.deleteConfirm')} onConfirm={() => handleDelete(product.id)}>
              <DeleteOutlined />
            </Popconfirm>,
          ] : []),
          <Button key="cart" type="link" icon={<ShoppingCartOutlined />} onClick={() => handleAddToCart(product)}>
            {t('marketplace.addToCart')}
          </Button>,
        ]}
      >
        <Meta title={product.name} description={product.description || t('common.noDescription')} />
        <div style={{ marginTop: 12 }}>
          <Row justify="space-between">
            <Text strong style={{ fontSize: 16, color: '#2B3A67' }}>
              {product.price != null ? `${product.price} DT` : 'N/A'}
            </Text>
            <Tag color={product.stock && product.stock > 0 ? 'green' : 'red'}>
              {product.stock && product.stock > 0 ? `${product.stock} ${t('marketplace.inStock')}` : t('marketplace.outOfStock')}
            </Tag>
          </Row>
        </div>
      </Card>
    </Col>
  );

  const tabItems = isArtist ? [
    {
      key: 'all',
      label: t('marketplace.allProducts'),
      children: (
        <div>
          <Input prefix={<SearchOutlined />} placeholder={t('marketplace.search')} value={searchAll}
            onChange={(e) => handleSearchAll(e.target.value)} style={{ width: 300, marginBottom: 16 }} />
          <Row gutter={[20, 20]}>
            {allProducts.slice((pageAll - 1) * pageSize, pageAll * pageSize).map(p => renderProductCard(p, user?.role === 'ADMIN'))}
          </Row>
          {allProducts.length > pageSize && (
            <Row justify="center" style={{ marginTop: 24 }}>
              <Pagination current={pageAll} pageSize={pageSize} total={allProducts.length}
                onChange={(p) => setPageAll(p)} showSizeChanger={false} />
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'my',
      label: t('marketplace.myProducts'),
      children: (
        <div>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Input prefix={<SearchOutlined />} placeholder={t('marketplace.searchMy')} value={searchMy}
              onChange={(e) => handleSearchMy(e.target.value)} style={{ width: 300 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('marketplace.addProduct')}
            </Button>
          </Row>
          <Row gutter={[20, 20]}>
            {myProducts.slice((pageMy - 1) * pageSize, pageMy * pageSize).map(p => renderProductCard(p, true))}
          </Row>
          {myProducts.length > pageSize && (
            <Row justify="center" style={{ marginTop: 24 }}>
              <Pagination current={pageMy} pageSize={pageSize} total={myProducts.length}
                onChange={(p) => setPageMy(p)} showSizeChanger={false} />
            </Row>
          )}
        </div>
      ),
    },
  ] : undefined;

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>{t('marketplace.title')}</Title>
        <Text type="secondary">{t('marketplace.subtitle')}</Text>
      </div>

      {isArtist ? (
        <Tabs items={tabItems} centered />
      ) : (
        <div>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Input prefix={<SearchOutlined />} placeholder={t('marketplace.search')} value={searchAll}
              onChange={(e) => handleSearchAll(e.target.value)} style={{ width: 300 }} />
          </Row>
          <Row gutter={[20, 20]}>
            {allProducts.slice((pageAll - 1) * pageSize, pageAll * pageSize).map(p => renderProductCard(p, false))}
          </Row>
          {allProducts.length > pageSize && (
            <Row justify="center" style={{ marginTop: 24 }}>
              <Pagination current={pageAll} pageSize={pageSize} total={allProducts.length}
                onChange={(p) => setPageAll(p)} showSizeChanger={false} />
            </Row>
          )}
        </div>
      )}

      {allProducts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary">{t('marketplace.noProducts')}</Text>
        </div>
      )}

      <Modal title={editingProduct ? t('marketplace.editProduct') : t('marketplace.addProduct')} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText={editingProduct ? t('common.update') : t('common.create')}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('marketplace.productName')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('marketplace.description')}><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label={t('marketplace.price')} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label={t('marketplace.stock')}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={t('marketplace.productImage')}>
            <Upload
              beforeUpload={(file) => { setImageFile(file); return false; }}
              maxCount={1}
              accept="image/*"
              listType="picture"
              onRemove={() => setImageFile(null)}
            >
              <Button icon={<UploadOutlined />}>{t('marketplace.selectImage')}</Button>
            </Upload>
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
                <Title level={4} style={{ margin: 0, color: '#2B3A67' }}>{previewImage.name}</Title>
                {previewImage.description && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('marketplace.description')}</Text>
                    <Text type="secondary">{previewImage.description}</Text>
                  </div>
                )}
                {previewImage.price != null && (
                  <Text strong style={{ fontSize: 18, color: '#27AE60' }}>{previewImage.price} DT</Text>
                )}
                {previewImage.stock != null && (
                  <Tag color={previewImage.stock > 0 ? 'green' : 'red'}>
                    {previewImage.stock > 0 ? `${previewImage.stock} ${t('marketplace.inStock')}` : t('marketplace.outOfStock')}
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
