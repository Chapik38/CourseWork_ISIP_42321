import { BaseModel } from './BaseModel.js';

const parseConfig = row => row ? ({
  ...row,
  components: typeof row.components === 'string' ? JSON.parse(row.components) : row.components
}) : null;

export class Configuration extends BaseModel {
  static async create({ userId, name, totalPrice, goal, budget, components, bottleneckScore }) {
    const result = await this.query(`INSERT INTO configurations
      (user_id,name,total_price,goal,budget,components,bottleneck_score)
      VALUES (:userId,:name,:totalPrice,:goal,:budget,:components,:bottleneckScore)`, {
      userId, name, totalPrice, goal, budget,
      components: JSON.stringify(components), bottleneckScore
    });
    return this.findByIdForUser(result.insertId, userId);
  }
  static async findByIdForUser(id, userId, isAdmin = false) {
    const sql = isAdmin ? 'SELECT * FROM configurations WHERE id=:id' : 'SELECT * FROM configurations WHERE id=:id AND user_id=:userId';
    return parseConfig(await this.one(sql, { id, userId }));
  }
  static async top(limit = 10) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    return this.query(`SELECT goal, COUNT(*) total, AVG(bottleneck_score) avg_bottleneck, AVG(total_price) avg_price
      FROM configurations GROUP BY goal ORDER BY total DESC LIMIT ${safeLimit}`);
  }
  static async listForUser(userId, limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
    return (await this.query(`SELECT * FROM configurations WHERE user_id=:userId ORDER BY created_at DESC LIMIT ${safeLimit}`, { userId })).map(parseConfig);
  }
  static async publicTop(limit = 8) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 24));
    return this.query(`SELECT c.id, c.name, c.goal, c.total_price, c.bottleneck_score, c.created_at, u.username
      FROM configurations c JOIN users u ON u.id = c.user_id
      ORDER BY c.bottleneck_score ASC, c.created_at DESC LIMIT ${safeLimit}`);
  }
}
