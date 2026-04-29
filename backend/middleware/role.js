export const roleGuard = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Нет авторизации' } });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Недостаточно прав' } });
  next();
};
