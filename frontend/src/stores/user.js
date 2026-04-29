import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useUserStore = defineStore('user', {
  state: () => ({ user: JSON.parse(localStorage.getItem('user') || 'null') }),
  getters: { isAdmin: s => s.user?.role === 'admin', isAuth: s => Boolean(s.user) },
  actions: {
    setAuth({ user, accessToken, refreshToken }) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },
    async logout() {
      try { await api.post('/auth/logout'); } catch {}
      this.user = null;
      localStorage.clear();
    }
  }
});
