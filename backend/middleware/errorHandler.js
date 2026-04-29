export function notFound(req, res, next) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ресурс не найден' } });
}
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[ERROR]', err);
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 && isProd ? 'Внутренняя ошибка сервера' : err.message,
      details: err.details || undefined
    }
  });
}
