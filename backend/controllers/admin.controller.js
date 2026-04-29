import { Component } from '../models/Component.js';
import { User } from '../models/User.js';
import { Configuration } from '../models/Configuration.js';
import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logger.js';

export async function createComponent(req, res) {
  const component = await Component.create(req.body);
  await logActivity(req, `admin.component.create:${component.id}`);
  res.status(201).json({ data: component });
}
export async function updateComponent(req, res) {
  const component = await Component.update(req.params.id, req.body);
  await logActivity(req, `admin.component.update:${req.params.id}`);
  res.json({ data: component });
}
export async function deleteComponent(req, res) {
  await Component.delete(req.params.id);
  await logActivity(req, `admin.component.delete:${req.params.id}`);
  res.status(204).send();
}
export async function listUsers(req, res) {
  res.json({ data: await User.list() });
}
export async function updateUser(req, res) {
  const user = await User.update(req.params.id, req.body);
  await logActivity(req, `admin.user.update:${req.params.id}`);
  res.json({ data: user });
}
export async function logs(req, res) {
  const [rows] = await pool.execute(`SELECT l.*, u.username FROM activity_logs l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 100`);
  res.json({ data: rows });
}
export async function stats(req, res) {
  const [registrations] = await pool.execute(`SELECT DATE(created_at) day, COUNT(*) count FROM users GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 14`);
  const [sessions] = await pool.execute(`SELECT COUNT(*) active FROM sessions WHERE expires > (UNIX_TIMESTAMP() * 1000)`);
  res.json({ data: { topConfigurations: await Configuration.top(), activeSessions: sessions[0]?.active || 0, registrationsByDay: registrations.reverse() } });
}
