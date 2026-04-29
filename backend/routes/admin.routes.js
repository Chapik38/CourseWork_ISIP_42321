import { Router } from 'express';
import { body, param } from 'express-validator';
import { authRequired } from '../middleware/auth.js';
import { roleGuard } from '../middleware/role.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { createComponent, deleteComponent, listUsers, logs, stats, updateComponent, updateUser } from '../controllers/admin.controller.js';
import { componentTypes } from './configurator.routes.js';

export const adminRouter = Router();
adminRouter.use(authRequired, roleGuard('admin'));

const componentRules = [
  body('type').isIn(componentTypes),
  body('name').isLength({ min: 2, max: 255 }),
  body('brand').isLength({ min: 2, max: 100 }),
  body('price').isFloat({ min: 0 }),
  body('specs').isObject(),
  body('tdp').isInt({ min: 0 }),
  body('compatibility').isObject()
];
adminRouter.post('/components', componentRules, validate, asyncHandler(createComponent));
adminRouter.put('/components/:id', param('id').isInt(), validate, asyncHandler(updateComponent));
adminRouter.delete('/components/:id', param('id').isInt(), validate, asyncHandler(deleteComponent));
adminRouter.get('/users', asyncHandler(listUsers));
adminRouter.patch('/users/:id', param('id').isInt(), body('role').optional().isIn(['user','moderator','admin']), body('is_banned').optional().isBoolean(), validate, asyncHandler(updateUser));
adminRouter.get('/logs', asyncHandler(logs));
adminRouter.get('/stats', asyncHandler(stats));
