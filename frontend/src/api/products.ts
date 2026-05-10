import api from './axios';

export interface ProductData {
  id: number;
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  hasImage: boolean;
}

export const productsApi = {
  getAll: () => api.get<ProductData[]>('/products'),
  getById: (id: number) => api.get<ProductData>(`/products/${id}`),
  search: (q: string) => api.get<ProductData[]>(`/products/search?q=${q}`),
  create: (data: any) => api.post<ProductData>('/products', data),
  update: (id: number, data: any) => api.put<ProductData>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};
