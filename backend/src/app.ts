import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { authenticate } from './middleware/authMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import recordsRouter from './routes/records';
import analyticsRouter from './routes/analytics';
import operationsRouter from './routes/operations';
import usersRouter from './routes/users';
import linenRouter from './routes/linen';

const app = express();

app.use(helmet());

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ].filter(Boolean) as string[]
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);

    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.vercel.app')) return callback(null, true);
    } catch {
      return callback(new Error(`CORS blocked origin: ${origin}`));
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

const healthHandler = (_: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.use('/api/records', authenticate, recordsRouter);
app.use('/api/analytics', authenticate, analyticsRouter);
app.use('/api/operations', authenticate, operationsRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/linen', authenticate, linenRouter);
app.use(errorMiddleware);

export default app;
