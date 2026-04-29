import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { configuratorRouter } from './configurator.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();
apiRouter.get('/health', (req, res) => res.json({ status: 'ok', service: 'CompCraft' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/', configuratorRouter);
apiRouter.use('/admin', adminRouter);
