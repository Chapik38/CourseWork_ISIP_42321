import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { dbConfig } from './db.js';

const MySQLStore = MySQLStoreFactory(session);

export function createSessionMiddleware() {
  const store = new MySQLStore({
    ...dbConfig,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 1000 * 60 * 60 * 24 * 30,
    schema: {
      tableName: 'sessions',
      columnNames: { session_id: 'sid', expires: 'expires', data: 'session' }
    }
  });

  return session({
    name: 'pc_configurator_sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  });
}
