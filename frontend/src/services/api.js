import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1', withCredentials: true });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, async error => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
    original._retry = true;
    const { data } = await api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') });
    localStorage.setItem('accessToken', data.accessToken);
    original.headers.Authorization = `Bearer ${data.accessToken}`;
    return api(original);
  }
  return Promise.reject(error);
});
