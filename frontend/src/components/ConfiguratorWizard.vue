<template>
  <div class="dns-configurator">
    <section class="dns-top-panel">
      <div>
        <p class="dns-eyebrow">CompCraft</p>
        <h1>Конфигуратор компьютера</h1>
        <p class="dns-subtitle">Интерфейс подбора сделан в стиле DNS: список категорий, совместимые товары, фильтры, карточки и быстрый расчёт.</p>
      </div>
      <div class="dns-summary-card">
        <span>Итого</span>
        <strong>{{ money(totalPrice) }}</strong>
        <small>{{ selectedRequiredCount }}/{{ requiredSlots.length }} обязательных</small>
      </div>
    </section>

    <section class="dns-build-card">
      <header class="dns-build-header">
        <b>Обязательные комплектующие</b>
        <div class="build-actions">
          <button @click="autoBuild" :disabled="loading">Автоподбор</button>
          <button class="secondary" @click="saveManual" :disabled="loading || selectedRequiredCount < requiredSlots.length">Сохранить</button>
          <span>{{ selectedRequiredCount }}/{{ requiredSlots.length }} <i>?</i></span>
        </div>
      </header>
      <div class="dns-progress"><span :style="{ width: progressWidth }"></span></div>

      <article v-for="slot in slots" :key="slot.type" class="dns-slot" :class="{ filled: selected[slot.type] }">
        <div class="dns-slot-icon">{{ slot.icon }}</div>
        <div class="dns-slot-main">
          <b>{{ slot.title }}</b>
          <p v-if="selected[slot.type]">{{ selected[slot.type].name }}</p>
          <p v-else-if="slot.required" class="muted">Обязательно</p>
          <p v-else class="muted">Опционально</p>
        </div>
        <div class="dns-slot-price" v-if="selected[slot.type]">{{ money(selected[slot.type].price) }}</div>
        <button class="dns-add-btn" @click="openPicker(slot)">{{ selected[slot.type] ? 'Изменить' : 'Добавить' }}</button>
        <button v-if="selected[slot.type]" class="dns-remove" @click="remove(slot.type)">×</button>
      </article>
    </section>

    <section class="dns-result" v-if="configuration">
      <h2>{{ configuration.name }}</h2>
      <p><span class="badge">{{ configuration.goal }}</span> Конфигурация сохранена. Bottleneck: <b>{{ configuration.bottleneck_score }}%</b></p>
    </section>

    <section class="best-builds">
      <header>
        <div>
          <p class="dns-eyebrow">Сообщество CompCraft</p>
          <h2>Лучшие пользовательские сборки ПК</h2>
        </div>
        <button class="secondary" @click="loadBestBuilds">Обновить</button>
      </header>
      <div v-if="bestBuildsLoading" class="dns-loader">Загрузка сборок...</div>
      <div v-else-if="!bestBuilds.length" class="dns-empty">Пока нет сохранённых сборок. Собери первую конфигурацию.</div>
      <div v-else class="best-builds-grid">
        <article v-for="build in bestBuilds" :key="build.id" class="best-build-card">
          <div class="best-build-head">
            <h3>{{ build.name }}</h3>
            <span>{{ build.goal }}</span>
          </div>
          <strong>{{ money(build.total_price) }}</strong>
          <p>Bottleneck: {{ Math.round(build.bottleneck_score || 0) }}%</p>
          <small>{{ build.username || 'Пользователь' }} · {{ new Date(build.created_at).toLocaleDateString('ru-RU') }}</small>
        </article>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="picker.open" class="dns-modal">
        <aside class="dns-filter-panel">
          <div class="dns-search"><span>⌕</span><input v-model="filters.search" placeholder="Поиск по фильтрам" /></div>
          <div class="dns-filter-block">
            <button class="dns-collapse">⌃ Наличие в магазинах</button>
            <label><input type="checkbox" checked /> В наличии</label>
            <label><input type="checkbox" checked /> Под заказ: сегодня</label>
            <label><input type="checkbox" checked /> Под заказ: завтра</label>
            <label><input type="checkbox" /> Отсутствующие в продаже</label>
          </div>
          <div class="dns-filter-block">
            <label><input v-model="filters.compatibleOnly" type="checkbox" /> Совместимые товары <span class="muted">({{ compatibleCount }})</span></label>
            <label><input v-model="filters.highRating" type="checkbox" /> Рейтинг 4 и выше</label>
            <label><input v-model="filters.reliable" type="checkbox" /> Надёжные модели</label>
          </div>
          <div class="dns-filter-block">
            <button class="dns-collapse">⌃ Цена</button>
            <div class="dns-price-row"><input v-model.number="filters.minPrice" placeholder="от" type="number" /><input v-model.number="filters.maxPrice" placeholder="до" type="number" /></div>
          </div>
          <div class="dns-filter-block">
            <button class="dns-collapse">⌃ Бренд</button>
            <label v-for="brand in brands" :key="brand"><input type="checkbox" :value="brand" v-model="filters.brands" /> {{ brand }}</label>
          </div>
          <button class="dns-apply" @click="applyFilters">Применить</button>
          <button class="dns-reset" @click="resetFilters">Сбросить</button>
        </aside>

        <main class="dns-products">
          <button class="dns-close" @click="picker.open=false">×</button>
          <div class="dns-chips">
            <button v-for="chip in chips" :key="chip" @click="filters.search = chip">{{ chip }}</button>
            <button class="link">Показать ещё⌄</button>
          </div>
          <div class="dns-sort-row">
            <span>Сортировка: <button class="dns-link" @click="sort = sort === 'popular' ? 'price' : 'popular'">{{ sort === 'popular' ? 'сначала популярные' : 'сначала дешевле' }}</button></span>
            <span>Группировка: <button class="dns-link">отсутствует</button></span>
          </div>
          <div class="dns-active-filters">
            <button v-if="filters.compatibleOnly" @click="filters.compatibleOnly=false">Совместимые товары ×</button>
            <button @click="resetFilters">Сбросить фильтры ×</button>
          </div>

          <div v-if="loadingProducts" class="dns-loader">Загрузка товаров...</div>
          <article v-for="product in visibleProducts" :key="product.id" class="dns-product-card">
            <div class="dns-product-image"><span>{{ picker.slot?.icon }}</span></div>
            <div class="dns-product-body">
              <h3>{{ product.name }}</h3>
              <div class="dns-tags"><span>Хит продаж</span></div>
              <div class="dns-meta">
                <label><input type="checkbox" /> Сравнить</label>
                <span>★ {{ product.specs?.rating || '4.82' }}</span>
                <span>{{ compactReviews(product.specs?.reviews) }} отзывов</span>
                <span class="ok">◎ {{ reliability(product) }}</span>
              </div>
              <p class="dns-delivery">В наличии в <b>{{ 210 + Number(product.id % 80) }}</b> магазинах · Доставим на дом <b>за 2 часа</b> · Пункты выдачи доступны</p>
            </div>
            <div class="dns-product-buy">
              <strong>{{ money(product.price) }}</strong>
              <small>от {{ money(Math.ceil(Number(product.price) / 12)) }}/мес.</small>
              <button @click="selectProduct(product)">Добавить</button>
            </div>
          </article>
          <div v-if="!visibleProducts.length && !loadingProducts" class="dns-empty">Нет товаров под выбранные фильтры.</div>
        </main>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../services/api';
import { useFlashStore } from '../stores/flash';

const emit = defineEmits(['created']);
const flash = useFlashStore();
const loading = ref(false);
const loadingProducts = ref(false);
const configuration = ref(null);
const sort = ref('popular');
const bestBuilds = ref([]);
const bestBuildsLoading = ref(false);

const form = ref({ name: 'Оптимальная сборка', budget: 120000, goal: 'gaming', priority: 'fps' });
const slots = [
  { type:'cpu', title:'Процессор', icon:'▣', required:true, chips:['AMD Ryzen 5','AMD Ryzen 7','Intel i5','Intel i7','AM4','AM5','LGA1700'] },
  { type:'motherboard', title:'Мат. плата', icon:'▤', required:true, chips:['На сокете AM5','На сокете AM4','На сокете LGA 1700','С поддержкой DDR4','С поддержкой DDR5'] },
  { type:'psu', title:'Блок питания', icon:'▥', required:true, chips:['650W','750W','850W','1000W','80+ Gold'] },
  { type:'case', title:'Корпус', icon:'▧', required:true, chips:['ATX','Micro-ATX','с окном','Airflow'] },
  { type:'gpu', title:'Видеокарта', icon:'▨', required:false, chips:['RTX 4060','RTX 4070','RTX 4080','RX 7800 XT','16 ГБ'] },
  { type:'cooler', title:'Охлаждение процессора', icon:'◉', required:true, chips:['Башенный кулер','Жидкостное','AM5','LGA1700','TDP 220 Вт'] },
  { type:'ram', title:'Оперативная память', icon:'▦', required:true, chips:['DDR4','DDR5','16 ГБ','32 ГБ','64 ГБ'] },
  { type:'storage', title:'Накопители', icon:'◫', required:true, chips:['NVMe','SATA','1 ТБ','2 ТБ','4 ТБ'] },
  { type:'sound', title:'Звуковая карта', icon:'▧', required:false, chips:['Creative','PCI-E','5.1'] },
  { type:'extra', title:'Доп. детали', icon:'▣', required:false, chips:['Вентиляторы','ARGB','PWM'] },
  { type:'peripheral', title:'Периферия', icon:'◌', required:false, chips:['Клавиатура','Мышь','Беспроводная'] },
  { type:'software', title:'ПО', icon:'◎', required:false, chips:['Windows 11','Антивирус','Офис'] }
];
const requiredSlots = slots.filter(s => s.required);
const selected = reactive({});
const picker = reactive({ open:false, slot:null, products:[] });
const filters = reactive({ search:'', compatibleOnly:true, highRating:false, reliable:false, minPrice:null, maxPrice:null, brands:[] });
const appliedFilters = ref(0);

const selectedRequiredCount = computed(() => requiredSlots.filter(s => selected[s.type]).length);
const progressWidth = computed(() => `${Math.round(selectedRequiredCount.value / requiredSlots.length * 100)}%`);
const totalPrice = computed(() => Object.values(selected).reduce((s, c) => s + Number(c?.price || 0), 0));
const chips = computed(() => picker.slot?.chips || []);
const brands = computed(() => [...new Set(picker.products.map(p => p.brand))].sort());
const compatibleCount = computed(() => picker.products.filter(isCompatible).length);

const visibleProducts = computed(() => {
  const search = filters.search.trim().toLowerCase();
  let list = picker.products.filter(p => {
    if (filters.compatibleOnly && !isCompatible(p)) return false;
    if (filters.highRating && Number(p.specs?.rating || 0) < 4) return false;
    if (filters.reliable && !/Corsair|Samsung|Seasonic|MSI|ASUS|DeepCool|Kingston/i.test(p.brand)) return false;
    if (filters.minPrice && Number(p.price) < filters.minPrice) return false;
    if (filters.maxPrice && Number(p.price) > filters.maxPrice) return false;
    if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
    if (search && !`${p.name} ${p.brand} ${JSON.stringify(p.specs)} ${p.socket || ''}`.toLowerCase().includes(search.replace('на сокете ', '').replace('с поддержкой ', ''))) return false;
    return true;
  });
  return list.sort((a,b) => sort.value === 'price' ? Number(a.price) - Number(b.price) : Number(b.specs?.reviews || 0) - Number(a.specs?.reviews || 0));
});

function money(v) { return new Intl.NumberFormat('ru-RU', { style:'currency', currency:'RUB', maximumFractionDigits:0 }).format(Number(v || 0)); }
function compactReviews(v) { const n = Number(v || 0); return n > 999 ? `${(n/1000).toFixed(1)}к` : n; }
function reliability(p) { return /Corsair|Samsung|Seasonic|MSI|ASUS|DeepCool|Kingston/i.test(p.brand) ? 'Отличная надёжность' : 'Хорошая надёжность'; }
function same(a,b) { return a && b && String(a).toLowerCase() === String(b).toLowerCase(); }
function isCompatible(p) {
  const cpu = selected.cpu;
  const mb = selected.motherboard;
  const pcCase = selected.case;
  if (p.type === 'motherboard' && cpu && !same(p.socket || p.compatibility?.cpu?.socket, cpu.socket)) return false;
  if (p.type === 'cpu' && mb && !same(p.socket, mb.socket || mb.compatibility?.cpu?.socket)) return false;
  if (p.type === 'ram' && mb && !same(p.socket || p.compatibility?.ram?.socket, mb.compatibility?.ram?.socket || mb.specs?.ram_type)) return false;
  if (p.type === 'cooler' && cpu && !(p.compatibility?.cooler?.sockets || []).includes(cpu.socket)) return false;
  if (p.type === 'case' && mb && !same(p.compatibility?.case?.form_factor || p.specs?.form_factor, mb.compatibility?.case?.form_factor || mb.specs?.form_factor)) return false;
  if (p.type === 'gpu' && pcCase && Number(p.compatibility?.case?.min_gpu_length_mm || 0) > Number(pcCase.specs?.max_gpu_length_mm || Infinity)) return false;
  return true;
}
async function openPicker(slot) {
  picker.open = true; picker.slot = slot; picker.products = []; resetFilters(false);
  loadingProducts.value = true;
  try {
    const { data } = await api.get('/components', { params: { type: slot.type } });
    picker.products = data.data || [];
  } catch (e) { flash.push('error', 'Не удалось загрузить товары'); }
  finally { loadingProducts.value = false; }
}
function selectProduct(product) {
  selected[product.type] = product;
  picker.open = false;
  flash.push('success', `${product.name} добавлен в сборку`);
}
function remove(type) { delete selected[type]; }
function resetFilters(clearSearch = true) {
  if (clearSearch) filters.search = '';
  filters.compatibleOnly = true; filters.highRating = false; filters.reliable = false; filters.minPrice = null; filters.maxPrice = null; filters.brands = []; appliedFilters.value++;
}
function applyFilters() { appliedFilters.value++; }
async function loadBestBuilds(){
  bestBuildsLoading.value = true;
  try {
    const { data } = await api.get('/configurations/public/top');
    bestBuilds.value = data.data || [];
  } catch(e){ flash.push('error', 'Не удалось загрузить лучшие сборки'); }
  finally { bestBuildsLoading.value = false; }
}
onMounted(loadBestBuilds);

async function autoBuild(){
  loading.value = true;
  try {
    const { data } = await api.post('/configurations', form.value);
    configuration.value = data.data;
    Object.keys(selected).forEach(k => delete selected[k]);
    for (const c of data.data.components) selected[c.type] = c;
    emit('created', data.data);
    flash.push('success', 'Конфигурация создана'); loadBestBuilds();
  } catch(e){ flash.push('error', e.response?.data?.error?.message || 'Ошибка создания конфигурации'); }
  finally { loading.value = false; }
}
async function saveManual(){
  loading.value = true;
  try {
    const componentIds = Object.values(selected).map(c => c.id);
    const { data } = await api.post('/configurations', { ...form.value, componentIds });
    configuration.value = data.data; emit('created', data.data); flash.push('success', 'Сборка сохранена'); loadBestBuilds();
  } catch(e){ flash.push('error', e.response?.data?.error?.details?.join('\n') || e.response?.data?.error?.message || 'Ошибка сохранения'); }
  finally { loading.value = false; }
}
</script>
