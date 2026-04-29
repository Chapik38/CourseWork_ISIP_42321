import { BaseModel } from './BaseModel.js';

export class User extends BaseModel {
  static async findByEmail(email) {
    return this.one('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
  }
  static async findById(id) {
    return this.one('SELECT id, username, email, role, created_at, is_banned FROM users WHERE id = :id', { id });
  }
  static async create({ username, email, passwordHash, role = 'user' }) {
    const result = await this.query(
      'INSERT INTO users (username,email,password_hash,role) VALUES (:username,:email,:passwordHash,:role)',
      { username, email, passwordHash, role }
    );
    return this.findById(result.insertId);
  }
  static async list({ limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
    const safeOffset = Math.max(0, Number(offset) || 0);
    return this.query(`SELECT id, username, email, role, created_at, is_banned FROM users ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`);
  }
  static async update(id, fields) {
    const allowed = ['role', 'is_banned'];
    const sets = Object.keys(fields).filter(k => allowed.includes(k));
    if (!sets.length) return this.findById(id);
    const sql = `UPDATE users SET ${sets.map(k => `${k} = :${k}`).join(', ')} WHERE id = :id`;
    await this.query(sql, { id, ...fields, is_banned: fields.is_banned ? 1 : 0 });
    return this.findById(id);
  }
}
