import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ConfiguratorView from '../views/ConfiguratorView.vue';
import AdminView from '../views/AdminView.vue';
import ProfileView from '../views/ProfileView.vue';
import PcCheckView from '../views/PcCheckView.vue';
import { useUserStore } from '../stores/user';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/configurator' },
    { path: '/login', component: LoginView },
    { path: '/configurator', component: ConfiguratorView, meta: { auth: true } },
    { path: '/profile', component: ProfileView, meta: { auth: true } },
    { path: '/pc-check', component: PcCheckView, meta: { auth: true } },
    { path: '/admin', component: AdminView, meta: { auth: true, admin: true } }
  ]
});
router.beforeEach(to => {
  const user = useUserStore();
  if (to.meta.auth && !user.isAuth) return '/login';
  if (to.meta.admin && !user.isAdmin) return '/configurator';
});
