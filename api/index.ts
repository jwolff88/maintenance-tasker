import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;
let initError: Error | null = null;

try {
  app = require('../backend/build/index.js').default;
} catch (err) {
  initError = err as Error;
  console.error('Failed to load backend:', err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) {
    return res.status(500).json({
      error: 'Backend initialization failed',
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
}
