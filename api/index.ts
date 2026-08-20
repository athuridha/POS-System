import express from 'express';

let app: express.Express;

try {
  // Dynamic import to catch startup errors
  const serverApp = require('../server/app');
  app = serverApp.default || serverApp;
} catch (err: any) {
  // If the main app fails to load, serve a diagnostic error page
  app = express();
  app.use(express.json());

  app.all('*', (_req, res) => {
    res.status(500).json({
      error: 'Server failed to initialize',
      message: err?.message || String(err),
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
    });
  });
}

export default app;
