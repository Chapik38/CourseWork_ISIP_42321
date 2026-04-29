import { Component } from '../models/Component.js';

const weightsByGoal = {
  gaming: { cpu: 0.18, motherboard: 0.10, gpu: 0.35, ram: 0.10, storage: 0.08, psu: 0.08, case: 0.06, cooler: 0.05, minRam: 16 },
  work: { cpu: 0.28, motherboard: 0.10, gpu: 0.14, ram: 0.18, storage: 0.12, psu: 0.08, case: 0.05, cooler: 0.05, minRam: 32 },
  design: { cpu: 0.22, motherboard: 0.10, gpu: 0.25, ram: 0.18, storage: 0.10, psu: 0.08, case: 0.04, cooler: 0.03, minRam: 32 },
  server: { cpu: 0.30, motherboard: 0.12, gpu: 0.02, ram: 0.24, storage: 0.18, psu: 0.08, case: 0.03, cooler: 0.03, minRam: 64 }
};

function perf(c) { return Number(c?.specs?.performanceScore || c?.specs?.score || 1); }
function ramCapacity(c) { return Number(c?.specs?.capacity_gb || 0); }
function psuWatts(c) { return Number(c?.specs?.watts || c?.compatibility?.psu?.min_watts || 0); }
function mbSocket(mb) { return mb?.socket || mb?.compatibility?.cpu?.socket; }
function mbRamSocket(mb) { return mb?.compatibility?.ram?.socket || mb?.specs?.ram_type; }
function componentRamSocket(c) { return c?.socket || c?.compatibility?.ram?.socket || c?.specs?.ram_type; }
function scoreValue(component, priority) {
  const value = perf(component) / Math.max(Number(component.price), 1);
  if (priority === 'cost') return value * 1.35;
  if (priority === 'stability') return perf(component) + (component.brand.match(/Corsair|Samsung|Seasonic|Noctua|MSI|ASUS/i) ? 10 : 0);
  return perf(component);
}
function pickBest(list, budget, priority, extra = () => true) {
  return list.filter(c => Number(c.price) <= budget && extra(c)).sort((a,b) => scoreValue(b, priority) - scoreValue(a, priority))[0] || null;
}
function addError(errors, message) { if (!errors.includes(message)) errors.push(message); }

export function validateCompatibility(parts) {
  const errors = [];
  const required = ['cpu','motherboard','psu','case','cooler','ram','storage'];
  for (const type of required) if (!parts[type]) addError(errors, `Обязательный компонент не выбран: ${type}.`);

  const cpu = parts.cpu, mb = parts.motherboard, gpu = parts.gpu, ram = parts.ram, storage = parts.storage, psu = parts.psu, pcCase = parts.case, cooler = parts.cooler;
  if (cpu && mb && cpu.socket && mbSocket(mb) && cpu.socket !== mbSocket(mb)) addError(errors, `Сокет CPU ${cpu.socket} не совместим с материнской платой ${mbSocket(mb)}.`);
  if (ram && mb && componentRamSocket(ram) && mbRamSocket(mb) && componentRamSocket(ram) !== mbRamSocket(mb)) addError(errors, `RAM ${componentRamSocket(ram)} не совместима с платой ${mbRamSocket(mb)}.`);
  if (cpu && cooler) {
    const supported = cooler.compatibility?.cooler?.sockets || [];
    if (supported.length && !supported.includes(cpu.socket)) addError(errors, `Охлаждение не поддерживает сокет ${cpu.socket}.`);
    if (cooler.compatibility?.cooler?.tdp_max && Number(cooler.compatibility.cooler.tdp_max) < Number(cpu.tdp)) addError(errors, 'Охлаждение недостаточно эффективно для выбранного процессора.');
  }
  if (mb && pcCase) {
    const caseForm = pcCase.compatibility?.case?.form_factor || pcCase.specs?.form_factor;
    const mbForm = mb.compatibility?.case?.form_factor || mb.specs?.form_factor;
    if (caseForm && mbForm && caseForm !== mbForm) addError(errors, `Корпус ${caseForm} не подходит для платы ${mbForm}.`);
  }
  if (gpu && pcCase) {
    const maxGpu = Number(pcCase.specs?.max_gpu_length_mm || 0);
    const gpuLen = Number(gpu.compatibility?.case?.min_gpu_length_mm || gpu.specs?.length_mm || 0);
    if (maxGpu && gpuLen && gpuLen > maxGpu) addError(errors, 'Видеокарта не помещается в выбранный корпус.');
  }
  if (storage && mb) {
    const storageInterface = storage.compatibility?.storage?.interface || storage.specs?.interface;
    const supported = mb.compatibility?.storage?.interfaces || [];
    if (supported.length && storageInterface && !supported.includes(storageInterface)) addError(errors, `Накопитель ${storageInterface} не поддерживается платой.`);
  }
  const totalTdp = ['cpu','gpu','storage','ram','cooler'].reduce((sum, type) => sum + Number(parts[type]?.tdp || 0), 0);
  if (psu && psuWatts(psu) < Math.ceil(totalTdp * 1.35)) addError(errors, `Мощность БП недостаточна: нужно минимум ${Math.ceil(totalTdp * 1.35)}W.`);
  return { ok: errors.length === 0, errors, totalTdp };
}

export function analyzeBottleneck(parts, goal = 'gaming') {
  const cpu = perf(parts.cpu), gpu = parts.gpu ? perf(parts.gpu) : 0, ram = ramCapacity(parts.ram), storage = perf(parts.storage);
  const weights = weightsByGoal[goal] || weightsByGoal.gaming;
  const issues = [];
  if (parts.gpu) {
    const cpuGpuGap = Math.abs(cpu - gpu) / Math.max(cpu, gpu, 1) * 100;
    if (goal === 'gaming' && gpu < cpu * 0.72) issues.push({ type: 'gpu', score: Math.round(cpuGpuGap), message: 'GPU заметно слабее CPU для игровой нагрузки.' });
    if (goal !== 'gaming' && gpu && cpu < gpu * 0.65) issues.push({ type: 'cpu', score: Math.round(cpuGpuGap), message: 'CPU может ограничивать рабочие или дизайн-задачи.' });
  } else if (goal === 'gaming' || goal === 'design') {
    issues.push({ type: 'gpu', score: 45, message: 'Для игровой или дизайн-сборки рекомендуется добавить дискретную видеокарту.' });
  }
  if (ram < weights.minRam) issues.push({ type: 'ram', score: Math.min(60, Math.round((weights.minRam - ram) / weights.minRam * 100)), message: `Для цели ${goal} рекомендуется минимум ${weights.minRam} GB RAM.` });
  if (storage < 55) issues.push({ type: 'storage', score: 18, message: 'Накопитель может быть слабым местом по скорости загрузки проектов и игр.' });
  const compatibility = validateCompatibility(parts);
  if (!compatibility.ok) issues.push(...compatibility.errors.map(message => ({ type: 'compatibility', score: 100, message })));
  const bottleneckScore = Math.min(100, Math.round(issues.reduce((s, i) => s + Number(i.score || 10), 0) / Math.max(issues.length, 1)));
  return { bottleneckScore: issues.length ? bottleneckScore : 0, issues, compatibility };
}

export async function buildOptimalConfiguration({ budget, goal, priority = 'fps' }) {
  const all = await Component.list({ limit: 1000 });
  const byType = type => all.filter(c => c.type === type);
  const weights = weightsByGoal[goal] || weightsByGoal.gaming;
  const target = type => Number(budget) * (weights[type] || 0.05);
  const parts = {};

  parts.cpu = pickBest(byType('cpu'), target('cpu') * 1.35, priority);
  parts.motherboard = pickBest(byType('motherboard'), target('motherboard') * 1.8, priority, c => !parts.cpu || mbSocket(c) === parts.cpu.socket);
  parts.ram = pickBest(byType('ram'), target('ram') * 1.5, priority, c => ramCapacity(c) >= weights.minRam && (!parts.motherboard || componentRamSocket(c) === mbRamSocket(parts.motherboard)))
    || pickBest(byType('ram'), target('ram') * 2, priority, c => !parts.motherboard || componentRamSocket(c) === mbRamSocket(parts.motherboard));
  parts.storage = pickBest(byType('storage'), target('storage') * 1.5, priority, c => !parts.motherboard || (parts.motherboard.compatibility?.storage?.interfaces || []).includes(c.compatibility?.storage?.interface || c.specs?.interface));
  parts.case = pickBest(byType('case'), target('case') * 1.8, priority, c => !parts.motherboard || (c.compatibility?.case?.form_factor || c.specs?.form_factor) === (parts.motherboard.compatibility?.case?.form_factor || parts.motherboard.specs?.form_factor));
  parts.cooler = pickBest(byType('cooler'), target('cooler') * 1.8, priority, c => (!parts.cpu || (c.compatibility?.cooler?.sockets || []).includes(parts.cpu.socket)) && Number(c.compatibility?.cooler?.tdp_max || 0) >= Number(parts.cpu?.tdp || 0));
  parts.gpu = pickBest(byType('gpu'), target('gpu') * 1.45, priority, c => goal !== 'server' || c.price < Number(budget) * 0.12);
  const tdp = ['cpu','gpu','storage','ram','cooler'].reduce((s, t) => s + Number(parts[t]?.tdp || 0), 0);
  parts.psu = pickBest(byType('psu'), target('psu') * 2.2, priority, c => psuWatts(c) >= Math.ceil(tdp * 1.35));
  const totalPrice = Object.values(parts).reduce((sum, c) => sum + Number(c?.price || 0), 0);
  const analysis = analyzeBottleneck(parts, goal);
  return { parts, totalPrice, analysis };
}

export async function suggestUpgrades(parts, goal, budgetLeft = 0) {
  const all = await Component.list({ limit: 1000 });
  const analysis = analyzeBottleneck(parts, goal);
  return analysis.issues.map(issue => {
    const current = parts[issue.type];
    const replacement = all.filter(c => c.type === issue.type && Number(c.price) <= Number(current?.price || 0) + Number(budgetLeft) && perf(c) > perf(current)).sort((a,b) => perf(b)-perf(a))[0];
    return { ...issue, current, replacement: replacement || null };
  });
}
