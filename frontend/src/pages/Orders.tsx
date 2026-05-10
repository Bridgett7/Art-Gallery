import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Tag, Space, message, Card, Popconfirm, Select, DatePicker,
  Input, Row, Col, Divider, List, Tabs
} from 'antd';
import { DeleteOutlined, FilterOutlined, ClearOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { ordersApi, OrderData, OrderItemData } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const btnPrimary = { background: '#4A6FA5', borderColor: '#4A6FA5', color: '#fff', fontWeight: 600, borderRadius: 8 };
const btnDanger = { background: '#FADBD8', borderColor: '#FADBD8', color: '#C0392B', fontWeight: 600, borderRadius: 8 };
const btnWarning = { background: '#FEF5E7', borderColor: '#FEF5E7', color: '#D68910', fontWeight: 600, borderRadius: 8 };
const btnLight = { background: '#EBF0FA', borderColor: '#EBF0FA', color: '#2C2F4A', fontWeight: 600, borderRadius: 8 };
const btnSuccess = { background: '#D5F5E3', borderColor: '#D5F5E3', color: '#1E8449', fontWeight: 600, borderRadius: 8 };

export default function Orders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [myOrders, setMyOrders] = useState<OrderData[]>([]);
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  // Address editing
  const [addressEditing, setAddressEditing] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [promoCode, setPromoCode] = useState('');

  // Admin filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<any>(null);
  const [dateTo, setDateTo] = useState<any>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const myRes = await ordersApi.getMy();
      setMyOrders(myRes.data);
      if (isAdmin) {
        const allRes = await ordersApi.getAll();
        setAllOrders(allRes.data);
        setFilteredOrders(allRes.data);
      }
    } catch { message.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleViewOrder = async (id: number) => {
    try {
      const res = await ordersApi.getById(id);
      setSelectedOrder(res.data);
      const parts = (res.data.deliveryLocation || '').split(', ');
      setStreet(parts[0] || ''); setCity(parts[1] || '');
      setPostalCode(parts[2] || ''); setCountry(parts[3] || '');
    } catch { message.error('Failed to load order'); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedOrder) return;
    try {
      await ordersApi.updateStatus(selectedOrder.id, 'CONFIRMED');
      message.success('Order placed!');
      handleViewOrder(selectedOrder.id); loadOrders();
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await ordersApi.updateStatus(selectedOrder.id, 'CANCELLED');
      message.success('Order cancelled');
      handleViewOrder(selectedOrder.id); loadOrders();
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteOrder = async (id?: number) => {
    const orderId = id || selectedOrder?.id;
    if (!orderId) return;
    try {
      await ordersApi.delete(orderId);
      message.success('Order deleted');
      setSelectedOrder(null); loadOrders();
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedOrder) return;
    try {
      await ordersApi.removeItem(selectedOrder.id, itemId);
      message.success('Item removed');
      handleViewOrder(selectedOrder.id);
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSaveAddress = async () => {
    if (!selectedOrder) return;
    const fullAddress = [street, city, postalCode, country].filter(Boolean).join(', ');
    try {
      await ordersApi.updateAddress(selectedOrder.id, fullAddress);
      message.success('Address updated');
      setAddressEditing(false); handleViewOrder(selectedOrder.id);
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      message.success('Status updated'); loadOrders();
      if (selectedOrder?.id === orderId) handleViewOrder(orderId);
    } catch (err: any) { message.error(err.response?.data?.error || 'Failed'); }
  };

  // Admin filters
  const handleApplyFilters = () => {
    let result = [...allOrders];
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (userSearch.trim()) {
      const s = userSearch.toLowerCase();
      result = result.filter(o => o.user?.username?.toLowerCase().includes(s));
    }
    if (dateFrom) result = result.filter(o => o.orderDate >= dateFrom.format('YYYY-MM-DD'));
    if (dateTo) result = result.filter(o => o.orderDate <= dateTo.format('YYYY-MM-DD'));
    setFilteredOrders(result);
  };

  const handleClearFilters = () => {
    setStatusFilter(null); setUserSearch(''); setDateFrom(null); setDateTo(null);
    setFilteredOrders(allOrders);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange'; case 'CONFIRMED': return 'blue';
      case 'SHIPPED': return 'purple'; case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red'; default: return 'default';
    }
  };

  const getTrackingMessage = (order: OrderData) => {
    switch (order.status) {
      case 'PENDING': return 'Awaiting confirmation';
      case 'CONFIRMED': return '📦 Your order is confirmed and being prepared';
      case 'SHIPPED': return '🚚 Your order is on its way!';
      case 'DELIVERED': return '✅ Order delivered';
      case 'CANCELLED': return '❌ Order cancelled';
      default: return '';
    }
  };

  // ===== ORDER DETAIL VIEW =====
  if (selectedOrder) {
    const subtotal = selectedOrder.total;
    const commission = subtotal * 0.05;
    const total = subtotal + commission;

    return (
      <div>
        <Row gutter={24}>
          <Col span={15}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedOrder(null)} style={{ ...btnLight, marginBottom: 16 }}>
              Back to Orders
            </Button>

            {/* Admin: status change */}
            {isAdmin && (
              <Card style={{ marginBottom: 16 }}>
                <Row align="middle" justify="space-between">
                  <Text strong>Update Order Status</Text>
                  <Select value={selectedOrder.status} style={{ width: 160 }}
                    onChange={(v) => handleStatusChange(selectedOrder.id, v)}>
                    <Select.Option value="PENDING">Pending</Select.Option>
                    <Select.Option value="CONFIRMED">Confirmed</Select.Option>
                    <Select.Option value="SHIPPED">Shipped</Select.Option>
                    <Select.Option value="DELIVERED">Delivered</Select.Option>
                    <Select.Option value="CANCELLED">Cancelled</Select.Option>
                  </Select>
                </Row>
              </Card>
            )}

            <Text strong style={{ fontSize: 16, color: '#4E73DF', display: 'block', marginBottom: 16 }}>
              {getTrackingMessage(selectedOrder)}
            </Text>

            <Card title={
              <Space>
                <Text strong style={{ fontSize: 18 }}>Order #{selectedOrder.id}</Text>
                <Tag color={statusColor(selectedOrder.status)}>{selectedOrder.status}</Tag>
              </Space>
            }>
              {selectedOrder.user && (
                <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                  <Text>User: <Text strong>{selectedOrder.user.username}</Text></Text>
                  <Text>Date: {selectedOrder.orderDate}</Text>
                </Space>
              )}
              <List
                dataSource={selectedOrder.items || []}
                locale={{ emptyText: 'No items in this order' }}
                renderItem={(item: OrderItemData) => (
                  <List.Item
                    actions={selectedOrder.status === 'PENDING' ? [
                      <Popconfirm title="Remove?" onConfirm={() => handleRemoveItem(item.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                      </Popconfirm>
                    ] : undefined}
                  >
                    <List.Item.Meta title={item.product?.name} description={`${item.product?.price} DT × ${item.quantity}`} />
                    <Text strong>{(item.product?.price * item.quantity).toFixed(2)} DT</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={9}>
            <Card title="Order Summary">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Row justify="space-between"><Text>Subtotal:</Text><Text>{subtotal.toFixed(2)} DT</Text></Row>
                <Row justify="space-between"><Text>Commission (5%):</Text><Text>{commission.toFixed(2)} DT</Text></Row>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Text strong style={{ fontSize: 16 }}>Total:</Text>
                  <Text strong style={{ fontSize: 16, color: '#4E73DF' }}>{total.toFixed(2)} DT</Text>
                </Row>
                <Divider />
                <Text strong>Delivery Address</Text>
                {addressEditing ? (
                  <div style={{ marginTop: 8 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street" />
                      <Row gutter={8}>
                        <Col span={14}><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" /></Col>
                        <Col span={10}><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal Code" /></Col>
                      </Row>
                      <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                      <Space>
                        <Button size="small" type="primary" onClick={handleSaveAddress}>Confirm Address</Button>
                        <Button size="small" onClick={() => setAddressEditing(false)}>Cancel</Button>
                      </Space>
                    </Space>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <Text>{selectedOrder.deliveryLocation || 'Not set'}</Text>
                    {selectedOrder.status === 'PENDING' && (
                      <Button size="small" style={{ marginLeft: 8 }} onClick={() => {
                        const parts = (selectedOrder.deliveryLocation || '').split(', ');
                        setStreet(parts[0] || ''); setCity(parts[1] || '');
                        setPostalCode(parts[2] || ''); setCountry(parts[3] || '');
                        setAddressEditing(true);
                      }}>Change Address</Button>
                    )}
                  </div>
                )}
                <Divider />
                <Text strong>Promo Code</Text>
                <Row gutter={8}>
                  <Col flex="auto"><Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="No promo code" /></Col>
                  <Col><Button onClick={() => message.info('Coming soon')}>Apply</Button></Col>
                </Row>
                <Divider />
                <Button block style={btnSuccess} onClick={handlePlaceOrder}
                  disabled={selectedOrder.status !== 'PENDING'}>
                  Place Order
                </Button>
                {selectedOrder.status !== 'PENDING' && selectedOrder.status !== 'CANCELLED' && (
                  <Button block type="default" icon={<DownloadOutlined />}
                    onClick={() => {
                      const url = ordersApi.downloadInvoice(selectedOrder.id);
                      fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                        .then(res => {
                          if (!res.ok) throw new Error('Not available');
                          return res.blob();
                        })
                        .then(blob => {
                          const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `invoice-order-${selectedOrder.id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(blobUrl);
                        })
                        .catch(() => message.error('Invoice not available yet'));
                    }}>
                    Download Invoice
                  </Button>
                )}
                <Button block style={btnLight} onClick={() => message.info('Add products from Marketplace')}
                  disabled={selectedOrder.status !== 'PENDING'}>
                  Add Product
                </Button>
                <Popconfirm title="Cancel this order?" onConfirm={handleCancelOrder}
                  disabled={selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED'}>
                  <Button block style={btnWarning}
                    disabled={selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED'}>
                    Cancel Order
                  </Button>
                </Popconfirm>
                <Popconfirm title="Delete this order permanently?" onConfirm={() => handleDeleteOrder()}>
                  <Button block style={btnDanger}>Delete Order</Button>
                </Popconfirm>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // ===== ORDER LIST VIEW =====
  const renderOrderCard = (order: OrderData, showUser: boolean) => (
    <Card key={order.id} style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: '20px' }}>
      <Row align="middle" justify="space-between">
        <Col>
          <Space direction="vertical" size={4}>
            <Space size={12}>
              <Text strong style={{ fontSize: 18 }}>Order #{order.id}</Text>
              <Tag color={statusColor(order.status)}>{order.status}</Tag>
            </Space>
            {showUser && <Text strong>User: {order.user?.username}</Text>}
            <Text type="secondary">Date: {order.orderDate}</Text>
            <Text type="secondary">{order.itemCount} items</Text>
            <Text strong style={{ fontSize: 16 }}>Total: {order.total.toFixed(2)} DT</Text>
          </Space>
        </Col>
        <Col>
          <Space direction="vertical" size={8}>
            <Button style={btnPrimary} onClick={() => handleViewOrder(order.id)} block>Manage</Button>
            <Popconfirm title="Delete?" onConfirm={() => handleDeleteOrder(order.id)}>
              <Button style={btnDanger} block>Delete</Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  // Build tabs
  const tabItems = [
    ...(isAdmin ? [{
      key: 'all',
      label: 'All Orders',
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginBottom: 12 }}>
            Total: {filteredOrders.length} orders
          </Text>
          <Card style={{ marginBottom: 20, borderRadius: 12 }}>
            <Row gutter={16} align="bottom">
              <Col>
                <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>Status</Text></div>
                <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Statuses" allowClear style={{ width: 150 }}>
                  <Select.Option value="PENDING">Pending</Select.Option>
                  <Select.Option value="CONFIRMED">Confirmed</Select.Option>
                  <Select.Option value="SHIPPED">Shipped</Select.Option>
                  <Select.Option value="DELIVERED">Delivered</Select.Option>
                  <Select.Option value="CANCELLED">Cancelled</Select.Option>
                </Select>
              </Col>
              <Col>
                <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>Search User</Text></div>
                <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Username" style={{ width: 180 }} />
              </Col>
              <Col>
                <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>From Date</Text></div>
                <DatePicker value={dateFrom} onChange={setDateFrom} style={{ width: 150 }} />
              </Col>
              <Col>
                <div style={{ marginBottom: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>To Date</Text></div>
                <DatePicker value={dateTo} onChange={setDateTo} style={{ width: 150 }} />
              </Col>
              <Col>
                <Space>
                  <Button style={btnPrimary} icon={<FilterOutlined />} onClick={handleApplyFilters}>Apply</Button>
                  <Button style={btnLight} icon={<ClearOutlined />} onClick={handleClearFilters}>Clear</Button>
                </Space>
              </Col>
            </Row>
          </Card>
          {filteredOrders.map(order => renderOrderCard(order, true))}
          {filteredOrders.length === 0 && <Card><Text type="secondary">No orders found</Text></Card>}
        </div>
      ),
    }] : []),
    {
      key: 'my',
      label: 'My Orders',
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginBottom: 12 }}>
            Total: {myOrders.length} orders
          </Text>
          {myOrders.map(order => renderOrderCard(order, false))}
          {myOrders.length === 0 && <Card><Text type="secondary">No orders yet</Text></Card>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <Title level={2} style={{ margin: 0, color: '#2B3A67' }}>ORDERS</Title>
        <Text type="secondary">View and manage orders</Text>
      </div>
      <Tabs items={tabItems} centered />
    </div>
  );
}
