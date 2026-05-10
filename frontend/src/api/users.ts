import api from './axios';

export const usersApi = {
  updateProfile: (data: { username?: string; email?: string }) => api.put('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/users/password', data),
  updateAddress: (data: { street: string; city: string; country: string; postalCode: string }) => api.put('/users/address', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/profile-picture', formData);
  },
  // Admin
  getAll: () => api.get('/admin/users'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
};
