import { Router } from 'express';
import { feedService } from '../services/feedService.js';

export const newsRouter = Router();

// GET /api/news — Main article listing with filters
newsRouter.get('/news', (req, res) => {
  const { category, priority, search, page, limit } = req.query;
  const result = feedService.getArticles({
    category,
    priority,
    search,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 30,
  });
  res.json(result);
});

// GET /api/breaking — Breaking / high-priority news
newsRouter.get('/breaking', (req, res) => {
  res.json({ articles: feedService.getBreakingNews() });
});

// GET /api/categories — All categories with article counts
newsRouter.get('/categories', (req, res) => {
  res.json({ categories: feedService.getCategories() });
});

// GET /api/stats — Dashboard statistics
newsRouter.get('/stats', (req, res) => {
  res.json(feedService.getStats());
});

// POST /api/refresh — Force refresh feeds
newsRouter.post('/refresh', async (req, res) => {
  try {
    await feedService.fetchAllFeeds();
    res.json({ success: true, stats: feedService.getStats() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh feeds' });
  }
});
