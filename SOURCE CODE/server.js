import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const distPath = path.join(__dirname, 'dist');

// Health check endpoint for Cloud Run container lifecycle
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static assets from the Vite build output directory
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      // Don't cache index.html to allow instant updates on deployment
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Fallback to index.html for Single Page Application client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If dist is missing, serve a clear diagnostic message
  app.get('*', (_req, res) => {
    res.status(503).send('Application build in progress. Please rebuild with `npm run build`.');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Production server running on http://${HOST}:${PORT}`);
});
