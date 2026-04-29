<template>
  <section class="card" v-if="configurationId">
    <h2>Realtime Bottleneck Analyzer</h2>
    <button @click="load" :disabled="loading">Анализировать</button>
    <div v-if="analysis" style="margin-top:16px">
      <h3>Итоговый bottleneck: {{ analysis.bottleneckScore }}%</h3>
      <p v-if="!analysis.issues.length" class="success">Узких мест не обнаружено.</p>
      <div v-for="issue in analysis.issues" :key="issue.type + issue.message" class="component-card">
        <b>{{ issue.type }}</b> — {{ Math.round(issue.score) }}%
        <p>{{ issue.message }}</p>
      </div>
    </div>
  </section>
</template>
<script setup>
import { ref } from 'vue';
import { api } from '../services/api';
import { useFlashStore } from '../stores/flash';
const props = defineProps({ configurationId: [String, Number] });
const analysis = ref(null); const loading = ref(false); const flash = useFlashStore();
async function load(){
  loading.value = true;
  try { analysis.value = (await api.get(`/configurations/${props.configurationId}/analysis`)).data.data; }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Не удалось выполнить анализ'); }
  finally { loading.value = false; }
}
defineExpose({ load });
</script>
