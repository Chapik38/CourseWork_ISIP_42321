import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/logger.js';

function publicUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function register(req, res) {
  const { username, email, password } = req.body;
  if (await User.findByEmail(email)) return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email уже зарегистрирован' } });
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
  const user = await User.create({ username, email, passwordHash });
  req.session.userId = user.id;
  await logActivity({ ...req, user }, 'auth.register');
  res.status(201).json({ user, accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' } });
  if (user.is_banned) return res.status(403).json({ error: { code: 'BANNED', message: 'Пользователь заблокирован' } });
  req.session.userId = user.id;
  await logActivity({ ...req, user }, 'auth.login');
  res.json({ user: publicUser(user), accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh-токен не передан' } });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (payload.tokenType !== 'refresh') throw new Error('bad token');
    const user = await User.findById(payload.sub);
    if (!user || user.is_banned) return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Refresh-токен недействителен' } });
    res.json({ user, accessToken: signAccessToken(user) });
  } catch {
    res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Refresh-токен недействителен' } });
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function logout(req, res) {
  await logActivity(req, 'auth.logout');
  req.session.destroy(() => res.status(204).send());
}
