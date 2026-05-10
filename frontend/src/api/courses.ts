import api from './axios';

export interface CourseData {
  id: number;
  title: string;
  description: string;
  level: string | null;
  price: number | null;
  duration: number | null;
  artistId: string;
}

export interface LessonData {
  id: number;
  title: string;
  description: string;
  level: string | null;
  lessonOrder: number | null;
  duration: number | null;
}

export interface PlanningData {
  id: number;
  course: string | null;
  lesson: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  status: string | null;
  notes: string | null;
  createdBy: string | null;
}

export const coursesApi = {
  getAll: () => api.get<CourseData[]>('/courses'),
  getById: (id: number) => api.get<CourseData>(`/courses/${id}`),
  search: (q: string) => api.get<CourseData[]>(`/courses/search?q=${q}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: number, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
  getLessons: (courseId: number) => api.get<LessonData[]>(`/courses/${courseId}/lessons`),
  createLesson: (courseId: number, data: any) => api.post(`/courses/${courseId}/lessons`, data),
  deleteLesson: (id: number) => api.delete(`/courses/lessons/${id}`),
  getPlanning: () => api.get<PlanningData[]>('/courses/planning'),
  createPlanning: (data: any) => api.post('/courses/planning', data),
  deletePlanning: (id: number) => api.delete(`/courses/planning/${id}`),
};
