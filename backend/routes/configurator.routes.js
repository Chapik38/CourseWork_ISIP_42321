import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authRequired, optionalSessionCheck } from '../middleware/auth.js';
import { analyzeConfiguration, analyzeOwnPc, createConfiguration, getComponent, getConfiguration, listComponents, listUserConfigurations, publicTopConfigurations, upgradeRecommendations } from '../controllers/configurator.controller.js';

export const configuratorRouter = Router();
export const componentTypes = ['cpu','motherboard','gpu','ram','storage','case','psu','cooler','sound','extra','peripheral','software'];

configuratorRouter.get('/components', query('type').optional().isIn(componentTypes), query('budget').optional().isFloat({ min: 0 }), validate, asyncHandler(listComponents));
configuratorRouter.get('/components/:id', param('id').isInt(), validate, asyncHandler(getComponent));
configuratorRouter.get('/configurations/public/top', asyncHandler(publicTopConfigurations));

configuratorRouter.use(authRequired, optionalSessionCheck);
configuratorRouter.get('/configurations', asyncHandler(listUserConfigurations));
configuratorRouter.post('/pc-check/analyze',
  body('goal').optional().isIn(['gaming','work','design','server']),
  body('componentIds').isArray({ min: 1 }),
  validate,
  asyncHandler(analyzeOwnPc)
);
configuratorRouter.post('/configurations',
  body('name').optional().isLength({ min: 2, max: 255 }),
  body('goal').isIn(['gaming','work','design','server']),
  body('budget').isFloat({ min: 300 }),
  body('priority').optional().isIn(['fps','stability','cost']),
  body('componentIds').optional().isArray(),
  validate,
  asyncHandler(createConfiguration)
);
configuratorRouter.get('/configurations/:id', param('id').isInt(), validate, asyncHandler(getConfiguration));
configuratorRouter.get('/configurations/:id/analysis', param('id').isInt(), validate, asyncHandler(analyzeConfiguration));
configuratorRouter.post('/configurations/:id/upgrade-recommendations', param('id').isInt(), body('budgetLeft').optional().isFloat({ min: 0 }), validate, asyncHandler(upgradeRecommendations));
