import { BaseModel } from './BaseModel.js';

const parseJsonFields = row => row ? ({
  ...row,
  specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs,
  compatibility: typeof row.compatibility === 'string' ? JSON.parse(row.compatibility) : row.compatibility
}) : null;

export class Component extends BaseModel {
  static async list({ type, budget, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = { limit, offset };
    if (type) { where.push('type = :type'); params.type = type; }
    if (budget) { where.push('price <= :budget'); params.budget = Number(budget); }
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const safeOffset = Math.max(0, Number(offset) || 0);
    const sql = `SELECT * FROM components ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY type, price LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    return (await this.query(sql, params)).map(parseJsonFields);
  }
  static async findById(id) {
    return parseJsonFields(await this.one('SELECT * FROM components WHERE id = :id', { id }));
  }
  static async findManyByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map((_, i) => `:id${i}`).join(',');
    const params = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));
    return (await this.query(`SELECT * FROM components WHERE id IN (${placeholders})`, params)).map(parseJsonFields);
  }
  static async create(data) {
    const result = await this.query(`INSERT INTO components (type,name,brand,price,specs,socket,tdp,compatibility)
      VALUES (:type,:name,:brand,:price,:specs,:socket,:tdp,:compatibility)`, {
      ...data, specs: JSON.stringify(data.specs), compatibility: JSON.stringify(data.compatibility)
    });
    return this.findById(result.insertId);
  }
  static async update(id, data) {
    const allowed = ['type','name','brand','price','specs','socket','tdp','compatibility'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return this.findById(id);
    const params = { id, ...data };
    if (params.specs) params.specs = JSON.stringify(params.specs);
    if (params.compatibility) params.compatibility = JSON.stringify(params.compatibility);
    await this.query(`UPDATE components SET ${fields.map(k => `${k}=:${k}`).join(', ')} WHERE id=:id`, params);
    return this.findById(id);
  }
  static async delete(id) {
    await this.query('DELETE FROM components WHERE id = :id', { id });
  }
}
