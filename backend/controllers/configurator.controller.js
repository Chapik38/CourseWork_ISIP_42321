import { Component } from '../models/Component.js';
import { Configuration } from '../models/Configuration.js';
import { analyzeBottleneck, buildOptimalConfiguration, suggestUpgrades, validateCompatibility } from '../services/configurator.service.js';
import { logActivity } from '../middleware/logger.js';

function mapParts(components) {
  const parts = {};
  for (const c of components) parts[c.type] = c;
  return parts;
}

export async function listComponents(req, res) {
  const components = await Component.list({ type: req.query.type, budget: req.query.budget, limit: req.query.limit || 500, offset: req.query.offset || 0 });
  res.json({ data: components });
}
export async function getComponent(req, res) {
  const component = await Component.findById(req.params.id);
  if (!component) return res.status(404).json({ error: { code: 'COMPONENT_NOT_FOUND', message: 'Компонент не найден' } });
  res.json({ data: component });
}
export async function listUserConfigurations(req, res) {
  const configurations = await Configuration.listForUser(req.user.id);
  res.json({ data: configurations });
}

export async function publicTopConfigurations(req, res) {
  const configurations = await Configuration.publicTop(8);
  res.json({ data: configurations });
}

export async function createConfiguration(req, res) {
  const { name, goal, budget, componentIds, priority } = req.body;
  let selectedComponents;
  if (componentIds?.length) {
    selectedComponents = await Component.findManyByIds(componentIds);
  } else {
    const built = await buildOptimalConfiguration({ budget, goal, priority });
    selectedComponents = Object.values(built.parts).filter(Boolean);
  }
  const parts = mapParts(selectedComponents);
  const compatibility = validateCompatibility(parts);
  if (!compatibility.ok) return res.status(422).json({ error: { code: 'INCOMPATIBLE_CONFIG', message: 'Конфигурация несовместима', details: compatibility.errors } });
  const analysis = analyzeBottleneck(parts, goal);
  const totalPrice = selectedComponents.reduce((sum, c) => sum + Number(c.price), 0);
  const configuration = await Configuration.create({
    userId: req.user.id,
    name: name || `PC ${goal}`,
    totalPrice,
    goal,
    budget,
    components: selectedComponents,
    bottleneckScore: analysis.bottleneckScore
  });
  await logActivity(req, 'configurations.create');
  res.status(201).json({ data: configuration, analysis });
}
export async function getConfiguration(req, res) {
  const configuration = await Configuration.findByIdForUser(req.params.id, req.user.id, req.user.role === 'admin');
  if (!configuration) return res.status(404).json({ error: { code: 'CONFIG_NOT_FOUND', message: 'Конфигурация не найдена' } });
  res.json({ data: configuration });
}
export async function analyzeConfiguration(req, res) {
  const configuration = await Configuration.findByIdForUser(req.params.id, req.user.id, req.user.role === 'admin');
  if (!configuration) return res.status(404).json({ error: { code: 'CONFIG_NOT_FOUND', message: 'Конфигурация не найдена' } });
  const analysis = analyzeBottleneck(mapParts(configuration.components), configuration.goal);
  res.json({ data: analysis });
}
export async function analyzeOwnPc(req, res) {
  const { componentIds = [], goal = 'gaming' } = req.body;
  if (!Array.isArray(componentIds) || !componentIds.length) {
    return res.status(400).json({ error: { code: 'NO_COMPONENTS', message: 'Выберите комплектующие для проверки ПК' } });
  }
  const selectedComponents = await Component.findManyByIds(componentIds);
  const parts = mapParts(selectedComponents);
  const analysis = analyzeBottleneck(parts, goal);
  const totalPrice = selectedComponents.reduce((sum, c) => sum + Number(c.price), 0);
  await logActivity(req, 'pc_check.analyze');
  res.json({ data: { parts, selectedComponents, totalPrice, goal, analysis } });
}

export async function upgradeRecommendations(req, res) {
  const configuration = await Configuration.findByIdForUser(req.params.id, req.user.id, req.user.role === 'admin');
  if (!configuration) return res.status(404).json({ error: { code: 'CONFIG_NOT_FOUND', message: 'Конфигурация не найдена' } });
  const recommendations = await suggestUpgrades(mapParts(configuration.components), configuration.goal, req.body.budgetLeft || 0);
  await logActivity(req, 'configurations.upgrade_recommendations');
  res.json({ data: recommendations });
}
