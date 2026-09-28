import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectorRouter } from './src/server/connector/router';
import { emitTelemetryEvent } from './src/server/connector/telemetryService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parser with ample limits for code analysis / diff previews
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount controlled server-side integration boundary for PROJECT-02
  app.use('/api', connectorRouter);

  // Health fallback directly on root API
  app.get('/health', (_req, res) => {
    res.json({
      application: 'PROJECT-03 (WALLIX)',
      version: '1.0.0',
      status: 'HEALTHY'
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROJECT-03] Target Application running on port ${PORT}`);
    console.log(`[PROJECT-03] PROJECT-02 Development Connector active at /api/connector`);
    emitTelemetryEvent(
      'application_started',
      'DEVELOPMENT',
      `boot-${Date.now().toString(36)}`,
      'task-system-boot',
      'agent-system-supervisor',
      { port: PORT, mode: process.env.NODE_ENV || 'development' }
    );
  });
}

startServer();
