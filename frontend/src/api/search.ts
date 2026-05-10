import api from './axios';

export interface SearchResults {
  artworks: { id: number; title: string; type: string }[];
  events: { id: number; name: string; type: string }[];
  products: { id: number; name: string; type: string }[];
  courses: { id: number; title: string; type: string }[];
}

export const searchApi = {
  global: (q: string) => api.get<SearchResults>(`/search?q=${q}`),
};
