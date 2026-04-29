<template>
  <ConfiguratorWizard @created="cfg => selectedId = cfg.id" />
  <BottleneckAnalyzer :configuration-id="selectedId" />
</template>
<script setup>
import { ref } from 'vue';
import ConfiguratorWizard from '../components/ConfiguratorWizard.vue';
import BottleneckAnalyzer from '../components/BottleneckAnalyzer.vue';
const selectedId = ref(null);
</script>
