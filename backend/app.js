import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import csrf from 'csurf';
import { apiRouter } from './routes/api.routes.js';
import { createSessionMiddleware } from './config/session.js';
import { requestLogger } from './middleware/logger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { sanitizeInputs } from './middleware/validate.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();
const app = express();
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(createSessionMiddleware());
app.use(requestLogger);
app.use(apiRateLimiter);
app.use(sanitizeInputs);

// CSRF включён для cookie/session сценариев. JWT-only запросы можно слать с x-csrf-token после GET /csrf-token.
const csrfProtection = csrf();
app.get(`${apiPrefix}/csrf-token`, csrfProtection, (req, res) => res.json({ csrfToken: req.csrfToken() }));
app.use(apiPrefix, (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  if (req.path.startsWith('/auth/')) return next();
  return csrfProtection(req, res, next);
}, apiRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`CompCraft API: http://localhost:${port}${apiPrefix}`));
