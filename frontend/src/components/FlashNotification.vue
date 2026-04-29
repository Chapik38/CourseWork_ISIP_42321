<template>
  <div class="flash-wrap">
    <TransitionGroup name="slide">
      <div v-for="item in flash.queue" :key="item.id" class="flash" :class="item.type" @click="flash.remove(item.id)">
        <strong>{{ labels[item.type] || item.type }}</strong><br />{{ item.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
<script setup>
import { useFlashStore } from '../stores/flash';
const flash = useFlashStore();
const labels = { success: 'Готово', error: 'Ошибка', warning: 'Внимание', info: 'Инфо' };
</script>
