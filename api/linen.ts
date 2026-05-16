import type { IncomingMessage, ServerResponse } from 'http';
import app from '../backend/src/app';

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[]>;
  url?: string;
};

const firstQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function handler(req: VercelRequest, res: ServerResponse) {
  const path = firstQueryValue(req.query?.path);
  const routePath = path ? `/api/linen/${path.replace(/^\/+/, '')}` : '/api/linen';
  const url = new URL(req.url || routePath, 'http://localhost');
  url.searchParams.delete('path');
  req.url = `${routePath}${url.search}`;

  return app(req, res);
}
