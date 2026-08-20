import express from 'express';
import type { Request, Response } from 'express';

let appPromise: Promise<express.Express>;

try {
  appPromise = import('../server/app').then((mod) => mod.default || mod);
} catch (err: any) {
  const fallback = express();
  fallback.use(express.json());
  fallback.all('*', (_req: Request, res: Response) => {
    res.status(500).json({
      error: 'Server failed to initialize (static)',
      message: err?.message || String(err),
    });
  });
  appPromise = Promise.resolve(fallback);
}

const handler = async (req: Request, res: Response) => {
  try {
    const app = await appPromise;
    app(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: 'Server failed to initialize (runtime)',
      message: err?.message || String(err),
    });
  }
};

export default handler;
