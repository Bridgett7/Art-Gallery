import api from './axios';

export interface ArtworkData {
  id: number;
  title: string;
  description: string;
  year: number | null;
  hasImage: boolean;
  artist: { idNumber: string; username: string } | null;
  category: { id: number; name: string } | null;
  catalogue: { id: number; name: string } | null;
}

export interface CategoryData {
  id: number;
  name: string;
}

export interface CatalogueData {
  id: number;
  name: string;
  description: string;
}

export const artworksApi = {
  getAll: () => api.get<ArtworkData[]>('/artworks'),
  getById: (id: number) => api.get<ArtworkData>(`/artworks/${id}`),
  search: (q: string) => api.get<ArtworkData[]>(`/artworks/search?q=${q}`),
  create: (data: any) => api.post<ArtworkData>('/artworks', data),
  update: (id: number, data: any) => api.put<ArtworkData>(`/artworks/${id}`, data),
  delete: (id: number) => api.delete(`/artworks/${id}`),
  getCategories: () => api.get<CategoryData[]>('/artworks/categories'),
  createCategory: (name: string) => api.post<CategoryData>('/artworks/categories', { name }),
  deleteCategory: (id: number) => api.delete(`/artworks/categories/${id}`),
  getCatalogues: () => api.get<CatalogueData[]>('/artworks/catalogues'),
  createCatalogue: (name: string, description: string) => api.post<CatalogueData>('/artworks/catalogues', { name, description }),
  deleteCatalogue: (id: number) => api.delete(`/artworks/catalogues/${id}`),
};
