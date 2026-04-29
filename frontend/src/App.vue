<template>
  <FlashNotification />
  <header class="topbar">
    <router-link to="/configurator" class="brand">CompCraft</router-link>
    <nav>
      <router-link v-if="user.isAuth" to="/configurator">Конфигуратор</router-link>
      <router-link v-if="user.isAuth" to="/pc-check">Проверка своего ПК</router-link>
      <router-link v-if="user.isAuth" to="/profile">Профиль</router-link>
      <router-link v-if="user.isAdmin" to="/admin">Admin</router-link>
      <router-link v-if="!user.isAuth" to="/login">Вход</router-link>
      <button v-else @click="user.logout()">Выйти</button>
    </nav>
  </header>
  <main class="container"><router-view /></main>
</template>
<script setup>
import FlashNotification from './components/FlashNotification.vue';
import { useUserStore } from './stores/user';
const user = useUserStore();
</script>
