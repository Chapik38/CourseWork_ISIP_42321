<template>
  <section class="auth-shell">
    <div class="auth-card">
      <p class="dns-eyebrow">CompCraft</p>
      <h1>{{ isRegister ? 'Создать аккаунт' : 'ЛОГИН' }}</h1>
      <p class="auth-subtitle">{{ isRegister ? 'Зарегистрируйся и сохраняй свои сборки ПК.' : 'Войди, чтобы открыть конфигуратор и профиль.' }}</p>

      <form @submit.prevent="submit">
        <label v-if="isRegister">Имя пользователя<input v-model.trim="form.username" required minlength="3" placeholder="chapa" /></label>
        <label>Email<input v-model.trim="form.email" type="email" required placeholder="you@example.com" /></label>
        <label>Пароль<input v-model="form.password" type="password" required minlength="8" placeholder="Минимум 8 символов" /></label>
        <label class="remember"><input type="checkbox" v-model="remember" /> Запомнить меня</label>
        <button class="auth-submit">{{ isRegister ? 'Создать аккаунт' : 'Войти' }}</button>
      </form>

      <p class="auth-switch" v-if="!isRegister">Нет аккаунта? <button @click="isRegister = true">Создать аккаунт</button></p>
      <p class="auth-switch" v-else>Уже есть аккаунт? <button @click="isRegister = false">Войти</button></p>
    </div>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { useUserStore } from '../stores/user';
import { useFlashStore } from '../stores/flash';
const isRegister = ref(false); const remember = ref(true); const form = ref({ username:'', email:'', password:'' });
const tab = computed(() => isRegister.value ? 'register' : 'login');
const user = useUserStore(); const flash = useFlashStore(); const router = useRouter();
async function submit(){
  try {
    if (isRegister.value && form.value.username.length < 3) return flash.push('warning','Имя пользователя минимум 3 символа');
    if (form.value.password.length < 8) return flash.push('warning','Пароль минимум 8 символов');
    const payload = isRegister.value ? form.value : { email: form.value.email, password: form.value.password };
    const { data } = await api.post(`/auth/${tab.value}`, payload);
    user.setAuth(data); flash.push('success','Добро пожаловать в CompCraft'); router.push('/configurator');
  } catch(e){ flash.push('error', e.response?.data?.error?.message || 'Ошибка авторизации'); }
}
</script>
