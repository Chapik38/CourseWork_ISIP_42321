import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });
}
export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, tokenType: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' });
}
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Требуется авторизация' } });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.is_banned) return res.status(401).json({ error: { code: 'USER_BLOCKED', message: 'Пользователь заблокирован или не найден' } });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Недействительный JWT-токен' } });
  }
}
export function optionalSessionCheck(req, res, next) {
  // Сессия используется как дополнительный серверный слой контроля для браузерного клиента.
  if (req.session) req.session.lastSeen = Date.now();
  next();
}
