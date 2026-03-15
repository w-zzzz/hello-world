import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { newsRouter } from './routes/news.js';
import { feedService } from './services/feedService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', newsRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initial feed fetch then start server
feedService.fetchAllFeeds().then(() => {
  app.listen(PORT, () => {
    console.log(`Financial News Aggregator running at http://localhost:${PORT}`);
  });

  // Refresh feeds every 10 minutes
  setInterval(() => feedService.fetchAllFeeds(), 10 * 60 * 1000);
}).catch(err => {
  console.error('Failed initial feed fetch, starting anyway:', err.message);
  app.listen(PORT, () => {
    console.log(`Financial News Aggregator running at http://localhost:${PORT} (feeds pending)`);
  });
  setInterval(() => feedService.fetchAllFeeds(), 2 * 60 * 1000);
});
