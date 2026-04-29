<template>
  <section class="card admin-head">
    <div>
      <h1>Admin Panel</h1>
      <p class="muted">Управление компонентами, пользователями и статистикой CompCraft.</p>
    </div>
    <button @click="loadAll">Обновить данные</button>
  </section>

  <section class="card">
    <h2>Статистика</h2>
    <p>Активные сессии: <b>{{ stats.activeSessions }}</b></p>
    <canvas ref="chartEl" height="90"></canvas>
    <table>
      <tr><th>Цель</th><th>Кол-во</th><th>Avg bottleneck</th><th>Avg price</th></tr>
      <tr v-for="r in stats.topConfigurations" :key="r.goal">
        <td>{{ goalLabel(r.goal) }}</td><td>{{ r.total }}</td><td>{{ Math.round(r.avg_bottleneck || 0) }}%</td><td>{{ money(r.avg_price || 0) }}</td>
      </tr>
    </table>
  </section>

  <section class="card">
    <h2>Компоненты</h2>
    <form class="admin-component-form" @submit.prevent="saveComponent">
      <label>Название<input v-model="component.name" placeholder="Например: Ryzen 7 7700" required /></label>
      <label>Бренд<input v-model="component.brand" placeholder="AMD / Intel / MSI" required /></label>
      <label>Тип
        <select v-model="component.type">
          <option v-for="t in componentTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </label>
      <label>Цена, ₽<input v-model.number="component.price" type="number" min="0" placeholder="14999" /></label>
      <label>TDP, Вт<input v-model.number="component.tdp" type="number" min="0" placeholder="65" /></label>
      <label>Сокет / стандарт
        <select v-model="component.socket">
          <option value="">Не требуется</option>
          <option v-for="s in socketOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>

      <div class="admin-subcard">
        <h3>Характеристики</h3>
        <label>Производительность, 1–100<input v-model.number="component.performanceScore" type="number" min="1" max="100" /></label>
        <label v-if="component.type === 'ram'">Объём RAM, GB<input v-model.number="component.capacityGb" type="number" min="1" /></label>
        <label v-if="component.type === 'psu'">Мощность БП, W<input v-model.number="component.watts" type="number" min="0" /></label>
        <label v-if="component.type === 'storage'">Интерфейс
          <select v-model="component.storageInterface"><option>NVMe</option><option>SATA</option></select>
        </label>
        <label v-if="component.type === 'motherboard' || component.type === 'case'">Форм-фактор
          <select v-model="component.formFactor"><option>ATX</option><option>Micro-ATX</option><option>Mini-ITX</option></select>
        </label>
        <label v-if="component.type === 'gpu'">Длина GPU, мм<input v-model.number="component.gpuLength" type="number" min="0" /></label>
        <label v-if="component.type === 'case'">Макс. длина GPU, мм<input v-model.number="component.maxGpuLength" type="number" min="0" /></label>
        <label v-if="component.type === 'cooler'">Макс. TDP охлаждения, Вт<input v-model.number="component.coolerTdpMax" type="number" min="0" /></label>
      </div>

      <div class="admin-subcard">
        <h3>Совместимость</h3>
        <p class="muted">JSON больше не нужно вводить вручную — объект формируется автоматически из полей.</p>
        <label v-if="component.type === 'motherboard'">Тип памяти
          <select v-model="component.ramType"><option>DDR4</option><option>DDR5</option></select>
        </label>
        <label v-if="component.type === 'motherboard'">Интерфейсы накопителей
          <select v-model="component.storageInterfaces" multiple>
            <option>NVMe</option><option>SATA</option>
          </select>
        </label>
        <label v-if="component.type === 'cooler'">Поддерживаемые сокеты
          <select v-model="component.coolerSockets" multiple>
            <option v-for="s in cpuSockets" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <pre>{{ preview }}</pre>
      </div>

      <button class="admin-create">Создать компонент</button>
    </form>
  </section>

  <section class="card">
    <h2>Пользователи</h2>
    <table><tr><th>Email</th><th>Role</th><th>Ban</th><th></th></tr><tr v-for="u in users" :key="u.id"><td>{{ u.email }}</td><td><select v-model="u.role"><option>user</option><option>moderator</option><option>admin</option></select></td><td><input style="width:auto" type="checkbox" v-model="u.is_banned" /></td><td><button @click="saveUser(u)">Save</button></td></tr></table>
  </section>

  <section class="card"><h2>Activity Logs</h2><table><tr><th>Time</th><th>User</th><th>Action</th><th>IP</th></tr><tr v-for="l in logs" :key="l.id"><td>{{ l.created_at }}</td><td>{{ l.username || '-' }}</td><td>{{ l.action }}</td><td>{{ l.ip }}</td></tr></table></section>
</template>
<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { api } from '../services/api';
import { useFlashStore } from '../stores/flash';
const flash = useFlashStore();
const users = ref([]); const logs = ref([]); const stats = ref({ topConfigurations:[], activeSessions:0, registrationsByDay:[] });
const chartEl = ref(null); let chart;
const cpuSockets = ['AM4','AM5','LGA1700','LGA1200'];
const ramSockets = ['DDR4','DDR5'];
const socketOptions = computed(() => {
  if (component.type === 'ram') return ramSockets;
  if (component.type === 'motherboard' || component.type === 'cpu' || component.type === 'cooler') return cpuSockets;
  return [...cpuSockets, ...ramSockets];
});
const componentTypes = [
  { value:'cpu', label:'Процессор' }, { value:'motherboard', label:'Мат. плата' }, { value:'gpu', label:'Видеокарта' },
  { value:'ram', label:'Оперативная память' }, { value:'storage', label:'Накопитель' }, { value:'case', label:'Корпус' },
  { value:'psu', label:'Блок питания' }, { value:'cooler', label:'Охлаждение CPU' }, { value:'sound', label:'Звуковая карта' },
  { value:'extra', label:'Доп. детали' }, { value:'peripheral', label:'Периферия' }, { value:'software', label:'ПО' }
];
const component = reactive({
  type:'cpu', name:'', brand:'', price:0, socket:'AM5', tdp:65, performanceScore:80,
  capacityGb:16, watts:650, storageInterface:'NVMe', formFactor:'ATX', gpuLength:280, maxGpuLength:360,
  coolerTdpMax:160, ramType:'DDR5', storageInterfaces:['NVMe','SATA'], coolerSockets:['AM4','AM5','LGA1700']
});
watch(() => component.type, type => {
  if (type === 'ram') component.socket = 'DDR5';
  else if (['cpu','motherboard','cooler'].includes(type)) component.socket = component.socket && !ramSockets.includes(component.socket) ? component.socket : 'AM5';
  else component.socket = '';
});
function money(v){ return `${Math.round(Number(v) || 0).toLocaleString('ru-RU')} ₽`; }
function goalLabel(g){ return ({gaming:'Игры',work:'Работа',design:'Дизайн',server:'Сервер'})[g] || g; }
function buildPayload(){
  const specs = { performanceScore: Number(component.performanceScore) || 1 };
  const compatibility = {};
  if (component.type === 'ram') { specs.capacity_gb = Number(component.capacityGb) || 0; specs.ram_type = component.socket; compatibility.ram = { socket: component.socket }; }
  if (component.type === 'psu') { specs.watts = Number(component.watts) || 0; compatibility.psu = { min_watts: Number(component.watts) || 0 }; }
  if (component.type === 'storage') { specs.interface = component.storageInterface; compatibility.storage = { interface: component.storageInterface }; }
  if (component.type === 'motherboard') { specs.form_factor = component.formFactor; specs.ram_type = component.ramType; compatibility.cpu = { socket: component.socket }; compatibility.ram = { socket: component.ramType, max_capacity: 192 }; compatibility.storage = { interfaces: component.storageInterfaces }; compatibility.case = { form_factor: component.formFactor }; }
  if (component.type === 'case') { specs.form_factor = component.formFactor; specs.max_gpu_length_mm = Number(component.maxGpuLength) || 0; compatibility.case = { form_factor: component.formFactor }; }
  if (component.type === 'gpu') { specs.length_mm = Number(component.gpuLength) || 0; compatibility.case = { min_gpu_length_mm: Number(component.gpuLength) || 0 }; compatibility.gpu = { min_pcie_lanes: 16 }; }
  if (component.type === 'cooler') { compatibility.cooler = { sockets: component.coolerSockets, tdp_max: Number(component.coolerTdpMax) || 0 }; }
  if (component.type === 'cpu') compatibility.cpu = { socket: component.socket, tdp_max: Number(component.tdp) || 0 };
  return { type: component.type, name: component.name, brand: component.brand, price: Number(component.price) || 0, socket: component.socket || null, tdp: Number(component.tdp) || 0, specs, compatibility };
}
const preview = computed(() => JSON.stringify({ specs: buildPayload().specs, compatibility: buildPayload().compatibility }, null, 2));
async function loadAll(){
  try { users.value=(await api.get('/admin/users')).data.data; logs.value=(await api.get('/admin/logs')).data.data; stats.value=(await api.get('/admin/stats')).data.data; await nextTick(); drawChart(); }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Admin data error'); }
}
function drawChart(){
  chart?.destroy(); if (!chartEl.value) return; const labels=stats.value.registrationsByDay.map(x=>x.day); const data=stats.value.registrationsByDay.map(x=>x.count);
  chart = new Chart(chartEl.value, { type:'line', data:{ labels, datasets:[{ label:'Регистрации', data }] }, options:{ responsive:true } });
}
async function saveComponent(){
  try { await api.post('/admin/components', buildPayload()); flash.push('success','Компонент создан'); component.name=''; component.brand=''; component.price=0; }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Ошибка компонента'); }
}
async function saveUser(u){
  try { await api.patch(`/admin/users/${u.id}`, { role:u.role, is_banned:Boolean(u.is_banned) }); flash.push('success','Пользователь обновлен'); }
  catch(e){ flash.push('error', e.response?.data?.error?.message || 'Ошибка пользователя'); }
}
onMounted(loadAll);
</script>
