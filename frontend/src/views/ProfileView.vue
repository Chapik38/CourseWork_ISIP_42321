<template>
  <section class="profile-hero">
    <div>
      <p class="dns-eyebrow">CompCraft ID</p>
      <h1>{{ user.user?.username || 'Профиль' }}</h1>
      <p>{{ user.user?.email }}</p>
    </div>
    <div class="profile-role">{{ roleLabel }}</div>
  </section>

  <section class="card profile-grid">
    <div>
      <h2>Данные аккаунта</h2>
      <dl class="profile-list">
        <dt>Имя пользователя</dt><dd>{{ user.user?.username }}</dd>
        <dt>Email</dt><dd>{{ user.user?.email }}</dd>
        <dt>Роль</dt><dd>{{ roleLabel }}</dd>
      </dl>
    </div>
    <div>
      <h2>Быстрые действия</h2>
      <router-link class="btn" to="/configurator">Открыть конфигуратор</router-link>
      <button class="secondary" @click="logout">Выйти из аккаунта</button>
    </div>
  </section>

  <section class="card">
    <header class="profile-section-head">
      <h2>Мои сборки</h2>
      <button class="secondary" @click="loadConfigurations">Обновить</button>
    </header>
    <div v-if="loading" class="dns-loader">Загрузка сборок...</div>
    <div v-else-if="!configs.length" class="dns-empty">Сохранённых сборок пока нет.</div>
    <div v-else class="best-builds-grid">
      <article v-for="cfg in configs" :key="cfg.id" class="best-build-card">
        <div class="best-build-head"><h3>{{ cfg.name }}</h3><span>{{ cfg.goal }}</span></div>
        <strong>{{ money(cfg.total_price) }}</strong>
        <p>Bottleneck: {{ Math.round(cfg.bottleneck_score || 0) }}%</p>
        <small>{{ new Date(cfg.created_at).toLocaleString('ru-RU') }}</small>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { useFlashStore } from '../stores/flash';
import { useUserStore } from '../stores/user';

const user = useUserStore();
const flash = useFlashStore();
const router = useRouter();
const configs = ref([]);
const loading = ref(false);
const roleLabel = computed(() => ({ admin:'Администратор', moderator:'Модератор', user:'Пользователь' }[user.user?.role] || 'Пользователь'));
function money(v){ return new Intl.NumberFormat('ru-RU', { style:'currency', currency:'RUB', maximumFractionDigits:0 }).format(Number(v || 0)); }
async function loadConfigurations(){
  loading.value = true;
  try { configs.value = (await api.get('/configurations')).data.data || []; }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Не удалось загрузить профиль'); }
  finally { loading.value = false; }
}
async function logout(){ await user.logout(); router.push('/login'); }
onMounted(loadConfigurations);
</script>
