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
  hasContent: boolean;
  hasAttachment: boolean;
  attachmentName: string | null;
  content?: string;
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
  getLessonDetail: (id: number) => api.get<LessonData>(`/courses/lessons/${id}`),
  createLesson: (courseId: number, data: any) => api.post(`/courses/${courseId}/lessons`, data),
  updateLessonContent: (id: number, content: string) => api.put(`/courses/lessons/${id}/content`, { content }),
  uploadLessonAttachment: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/courses/lessons/${id}/attachment`, formData);
  },
  deleteLesson: (id: number) => api.delete(`/courses/lessons/${id}`),
  getPlanning: () => api.get<PlanningData[]>('/courses/planning'),
  createPlanning: (data: any) => api.post('/courses/planning', data),
  deletePlanning: (id: number) => api.delete(`/courses/planning/${id}`),
};
