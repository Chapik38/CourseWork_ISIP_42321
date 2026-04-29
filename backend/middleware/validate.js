import { validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Ошибка валидации', details: result.array() } });
  next();
}
export function sanitizeInputs(req, res, next) {
  const clean = obj => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} }).trim();
      else if (typeof obj[key] === 'object') clean(obj[key]);
    }
    return obj;
  };
  clean(req.body); clean(req.query); clean(req.params);
  next();
}
