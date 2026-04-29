import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authRequired } from '../middleware/auth.js';
import { login, register, refresh, me, logout } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter,
  body('username').isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isStrongPassword({ minLength: 8, minNumbers: 1, minSymbols: 0 }),
  validate,
  asyncHandler(register)
);

authRouter.post('/login', authRateLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  validate,
  asyncHandler(login)
);

authRouter.post('/refresh', body('refreshToken').isString(), validate, asyncHandler(refresh));
authRouter.get('/me', authRequired, asyncHandler(me));
authRouter.post('/logout', authRequired, asyncHandler(logout));
