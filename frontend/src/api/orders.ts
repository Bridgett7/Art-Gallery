import api from './axios';

export interface OrderData {
  id: number;
  orderDate: string;
  status: string;
  deliveryLocation: string;
  user: { idNumber: string; username: string };
  itemCount: number;
  total: number;
  items?: OrderItemData[];
}

export interface OrderItemData {
  id: number;
  quantity: number;
  product: { id: number; name: string; price: number };
}

export const ordersApi = {
  getMy: () => api.get<OrderData[]>('/orders'),
  getAll: () => api.get<OrderData[]>('/orders/all'),
  getById: (id: number) => api.get<OrderData>(`/orders/${id}`),
  getActive: () => api.get('/orders/active'),
  create: (deliveryLocation: string) => api.post<OrderData>('/orders', { deliveryLocation }),
  addItem: (orderId: number, productId: number, quantity: number) =>
    api.post(`/orders/${orderId}/items`, { productId, quantity }),
  removeItem: (orderId: number, itemId: number) => api.delete(`/orders/${orderId}/items/${itemId}`),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  updateAddress: (id: number, deliveryLocation: string) => api.put(`/orders/${id}/address`, { deliveryLocation }),
  delete: (id: number) => api.delete(`/orders/${id}`),
  getInvoiceStatus: (id: number) => api.get<{ available: boolean }>(`/orders/${id}/invoice/status`),
  downloadInvoice: (id: number) => `/api/orders/${id}/invoice`,
};
