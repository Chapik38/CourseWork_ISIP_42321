<template>
  <section class="pc-check-hero">
    <div>
      <p class="dns-eyebrow">CompCraft диагностика</p>
      <h1>Проверка своего ПК</h1>
      <p>Выбери комплектующие уже существующего компьютера — сервис проверит совместимость, оценит bottleneck и подскажет, что лучше улучшить первым.</p>
    </div>
    <div class="pc-check-score" v-if="result">
      <span>Итог</span>
      <strong>{{ result.analysis.bottleneckScore }}%</strong>
      <small>bottleneck</small>
    </div>
  </section>

  <section class="card pc-check-settings">
    <label>Сценарий использования
      <select v-model="goal">
        <option value="gaming">Игры</option>
        <option value="work">Работа</option>
        <option value="design">Дизайн / монтаж</option>
        <option value="server">Сервер</option>
      </select>
    </label>
    <label>Поиск по всем комплектующим
      <input v-model.trim="search" placeholder="Например: Ryzen, RTX, DDR5, 750W" />
    </label>
    <button @click="analyze" :disabled="loading || !selectedIds.length">{{ loading ? 'Проверяем...' : 'Проверить ПК' }}</button>
  </section>

  <section class="pc-check-layout">
    <aside class="card pc-check-summary">
      <h2>Выбранные комплектующие</h2>
      <p class="muted">Можно выбрать любые комплектующие из полной базы CompCraft. Для проверки не обязательно собирать новый ПК — выбери то, что уже стоит в твоём компьютере.</p>
      <div v-for="slot in slots" :key="slot.type" class="pc-check-selected">
        <span>{{ slot.icon }}</span>
        <div>
          <b>{{ slot.label }}</b>
          <p>{{ selected[slot.type]?.name || 'Не выбрано' }}</p>
        </div>
        <button v-if="selected[slot.type]" class="secondary" @click="clearSlot(slot.type)">×</button>
      </div>
    </aside>

    <div class="pc-check-products">
      <section v-for="slot in slots" :key="slot.type" class="card pc-check-category">
        <header>
          <div>
            <h2>{{ slot.label }}</h2>
            <p class="muted">Показаны все варианты этой категории из базы</p>
          </div>
          <span>{{ componentsByType(slot.type).length }} вариантов</span>
        </header>

        <div v-if="!componentsByType(slot.type).length" class="pc-check-empty">
          Нет компонентов этой категории. Добавь их в админке или запусти seed заново.
        </div>

        <div v-else class="pc-check-list full-list">
          <button
            v-for="component in componentsByType(slot.type)"
            :key="component.id"
            class="pc-check-item"
            :class="{ active: selected[slot.type]?.id === component.id }"
            @click="selectComponent(slot.type, component)"
          >
            <span class="pc-check-item-icon">{{ slot.icon }}</span>
            <span class="pc-check-item-main">
              <b>{{ component.name }}</b>
              <small>{{ component.brand }} · {{ detailsLine(component) }}</small>
              <small class="pc-check-meta">{{ metaLine(component) }}</small>
            </span>
            <strong>{{ money(component.price) }}</strong>
          </button>
        </div>
      </section>
    </div>
  </section>

  <section v-if="result" class="card pc-check-result">
    <header>
      <div>
        <h2>Результат проверки</h2>
        <p class="muted">Оценка рассчитана по выбранным комплектующим и сценарию использования.</p>
      </div>
      <strong>{{ result.analysis.bottleneckScore }}%</strong>
    </header>

    <div class="pc-check-status" :class="statusClass">
      {{ statusText }}
    </div>

    <div v-if="result.analysis.compatibility?.errors?.length" class="pc-check-warnings">
      <h3>Проблемы совместимости</h3>
      <p v-for="err in result.analysis.compatibility.errors" :key="err">{{ err }}</p>
    </div>

    <div class="pc-check-warnings">
      <h3>Узкие места и рекомендации</h3>
      <p v-if="!result.analysis.issues.length">Серьёзных узких мест не найдено. Конфигурация выглядит сбалансированной.</p>
      <p v-for="issue in result.analysis.issues" :key="issue.type + issue.message">
        <b>{{ issue.type }}:</b> {{ issue.message }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../services/api';
import { useFlashStore } from '../stores/flash';

const flash = useFlashStore();
const loading = ref(false);
const allComponents = ref([]);
const goal = ref('gaming');
const search = ref('');
const result = ref(null);

const selected = reactive({ cpu:null, motherboard:null, gpu:null, ram:null, storage:null, psu:null, case:null, cooler:null, sound:null, extra:null, peripheral:null, software:null });
const slots = [
  { type:'cpu', label:'Процессор', icon:'▦' }, { type:'motherboard', label:'Мат. плата', icon:'▤' },
  { type:'gpu', label:'Видеокарта', icon:'🎮' }, { type:'ram', label:'Оперативная память', icon:'▥' },
  { type:'storage', label:'Накопитель', icon:'◉' }, { type:'psu', label:'Блок питания', icon:'⚡' },
  { type:'case', label:'Корпус', icon:'▯' }, { type:'cooler', label:'Охлаждение CPU', icon:'◎' },
  { type:'sound', label:'Звуковая карта', icon:'♫' }, { type:'extra', label:'Доп. детали', icon:'+' },
  { type:'peripheral', label:'Периферия', icon:'⌁' }, { type:'software', label:'ПО', icon:'◌' }
];
const selectedIds = computed(() => Object.values(selected).filter(Boolean).map(x => x.id));
const statusClass = computed(() => result.value?.analysis.bottleneckScore > 45 ? 'bad' : result.value?.analysis.bottleneckScore > 20 ? 'warn' : 'good');
const statusText = computed(() => {
  const score = result.value?.analysis.bottleneckScore || 0;
  if (score > 45) return 'ПК требует апгрейда: есть сильные ограничения производительности.';
  if (score > 20) return 'ПК рабочий, но есть компоненты, которые могут ограничивать производительность.';
  return 'ПК сбалансирован для выбранного сценария.';
});
function money(v){ return `${Math.round(Number(v) || 0).toLocaleString('ru-RU')} ₽`; }
function selectComponent(type, component){ selected[type] = component; result.value = null; }
function clearSlot(type){ selected[type] = null; result.value = null; }
function stringifySpecs(component){ return JSON.stringify({ ...component.specs, ...component.compatibility }).toLowerCase(); }
function detailsLine(component){
  if (component.socket) return component.socket;
  if (component.specs?.ram_type) return component.specs.ram_type;
  if (component.specs?.interface) return component.specs.interface;
  if (component.specs?.watts) return `${component.specs.watts} Вт`;
  if (component.specs?.form_factor) return component.specs.form_factor;
  return `TDP ${component.tdp || 0} Вт`;
}
function metaLine(component){
  const parts = [];
  if (component.specs?.performanceScore) parts.push(`производительность ${component.specs.performanceScore}`);
  if (component.specs?.capacity_gb) parts.push(`${component.specs.capacity_gb} ГБ`);
  if (component.specs?.wattage || component.specs?.watts) parts.push(`${component.specs.wattage || component.specs.watts} Вт`);
  if (component.tdp) parts.push(`TDP ${component.tdp} Вт`);
  if (component.specs?.gpu_length_mm) parts.push(`${component.specs.gpu_length_mm} мм`);
  return parts.join(' · ') || 'характеристики доступны в карточке компонента';
}
function componentsByType(type){
  const q = search.value.toLowerCase();
  return allComponents.value
    .filter(c => c.type === type)
    .filter(c => !q || `${c.name} ${c.brand} ${c.socket || ''} ${stringifySpecs(c)}`.toLowerCase().includes(q))
    .sort((a, b) => Number(a.price) - Number(b.price));
}
async function loadComponents(){
  try { allComponents.value = (await api.get('/components', { params: { limit: 500 } })).data.data; }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Не удалось загрузить компоненты'); }
}
async function analyze(){
  loading.value = true;
  try {
    result.value = (await api.post('/pc-check/analyze', { goal: goal.value, componentIds: selectedIds.value })).data.data;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } catch(e) { flash.push('error', e.response?.data?.error?.message || 'Ошибка проверки ПК'); }
  finally { loading.value = false; }
}
onMounted(loadComponents);
</script>
