import api from './axios';

export interface EventData {
  id: number;
  name: string;
  theme: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  featured: boolean;
  capacity: number | null;
  ticketPriceVisitor: number | null;
  ticketPriceArtist: number | null;
  description?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  hasImage?: boolean;
  ticketsSold?: number;
  revenue?: number;
}

export const eventsApi = {
  getAll: () => api.get<EventData[]>('/events'),
  getById: (id: number) => api.get<EventData>(`/events/${id}`),
  getUpcoming: () => api.get<EventData[]>('/events/upcoming'),
  getOngoing: () => api.get<EventData[]>('/events/ongoing'),
  search: (q: string) => api.get<EventData[]>(`/events/search?q=${q}`),
  getMyTickets: () => api.get('/events/my-tickets'),
  create: (data: any) => api.post<EventData>('/events', data),
  update: (id: number, data: any) => api.put<EventData>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  purchaseTicket: (eventId: number, ticketType: string) => api.post(`/events/${eventId}/tickets`, { ticketType }),
};
