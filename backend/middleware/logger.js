import morgan from 'morgan';
import { pool } from '../config/db.js';

export const requestLogger = morgan(':method :url :status :response-time ms');

export async function logActivity(req, action) {
  try {
    await pool.execute('INSERT INTO activity_logs (user_id, action, ip) VALUES (:userId, :action, :ip)', {
      userId: req.user?.id || null,
      action,
      ip: req.ip
    });
  } catch (error) {
    console.error('[ACTIVITY_LOG_ERROR]', error.message);
  }
}
