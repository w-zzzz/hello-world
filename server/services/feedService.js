import Parser from 'rss-parser';
import NodeCache from 'node-cache';
import { categorizeArticle, scorePriority, generateSummary } from '../utils/nlp.js';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'FinancialNewsAggregator/1.0',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['dc:creator', 'creator'],
    ],
  },
});

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Authoritative financial & economic news RSS feeds
const FEED_SOURCES = [
  // Major Financial News
  { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', tier: 1 },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', tier: 1 },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC Top News', tier: 1 },
  { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', name: 'CNBC Finance', tier: 1 },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories', name: 'MarketWatch', tier: 1 },

  // Economic & Policy
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', name: 'Yahoo Finance S&P 500', tier: 1 },
  { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', tier: 1 },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NYT Business', tier: 2 },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', name: 'NYT Economy', tier: 2 },
  { url: 'https://feeds.washingtonpost.com/rss/business', name: 'Washington Post Business', tier: 2 },

  // Crypto & Tech Finance
  { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph', tier: 2 },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', tier: 2 },
  { url: 'https://techcrunch.com/category/fintech/feed/', name: 'TechCrunch Fintech', tier: 2 },

  // Investing & Analysis
  { url: 'https://seekingalpha.com/market_currents.xml', name: 'Seeking Alpha', tier: 2 },
  { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com', tier: 2 },
  { url: 'https://feeds.feedburner.com/zerohedge/feed', name: 'ZeroHedge', tier: 3 },

  // Global / Macro
  { url: 'https://www.economist.com/finance-and-economics/rss.xml', name: 'The Economist', tier: 1 },
  { url: 'https://www.bbc.co.uk/news/business/rss.xml', name: 'BBC Business', tier: 2 },
];

class FeedService {
  constructor() {
    this.articles = [];
    this.lastFetchTime = null;
    this.fetchErrors = [];
  }

  async fetchAllFeeds() {
    const cached = cache.get('all_articles');
    if (cached) {
      this.articles = cached;
      return cached;
    }

    const results = await Promise.allSettled(
      FEED_SOURCES.map(source => this.fetchSingleFeed(source))
    );

    const newArticles = [];
    this.fetchErrors = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        newArticles.push(...result.value);
      } else if (result.status === 'rejected') {
        this.fetchErrors.push(result.reason?.message || 'Unknown error');
      }
    }

    // Deduplicate by title similarity
    const seen = new Set();
    const unique = newArticles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by priority score (descending), then by date (newest first)
    unique.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(b.pubDate) - new Date(a.pubDate);
    });

    this.articles = unique;
    this.lastFetchTime = new Date().toISOString();
    cache.set('all_articles', unique);

    console.log(`Fetched ${unique.length} unique articles from ${FEED_SOURCES.length} sources (${this.fetchErrors.length} errors)`);
    return unique;
  }

  async fetchSingleFeed(source) {
    try {
      const feed = await parser.parseURL(source.url);
      return (feed.items || []).slice(0, 20).map(item => {
        const categories = categorizeArticle(item.title, item.contentSnippet || item.content || '');
        const priority = scorePriority(item, source.tier, categories);
        const summary = generateSummary(item.contentSnippet || item.content || item.title);

        return {
          id: Buffer.from(`${source.name}:${item.title}`).toString('base64').substring(0, 40),
          title: item.title?.trim() || 'Untitled',
          summary,
          content: item.contentSnippet || item.content || '',
          link: item.link,
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: source.name,
          sourceTier: source.tier,
          author: item.creator || item.author || source.name,
          categories,
          priorityScore: priority,
          priorityLabel: priority >= 80 ? 'breaking' : priority >= 60 ? 'high' : priority >= 40 ? 'medium' : 'standard',
          image: extractImage(item),
        };
      });
    } catch (err) {
      console.warn(`Failed to fetch ${source.name}: ${err.message}`);
      return [];
    }
  }

  getArticles({ category, priority, search, page = 1, limit = 30 }) {
    let filtered = [...this.articles];

    if (category && category !== 'all') {
      filtered = filtered.filter(a => a.categories.includes(category));
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter(a => a.priorityLabel === priority);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      articles: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      lastUpdated: this.lastFetchTime,
    };
  }

  getCategories() {
    const counts = {};
    for (const a of this.articles) {
      for (const c of a.categories) {
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getBreakingNews() {
    return this.articles
      .filter(a => a.priorityScore >= 75)
      .slice(0, 10);
  }

  getStats() {
    return {
      totalArticles: this.articles.length,
      sources: [...new Set(this.articles.map(a => a.source))].length,
      categories: this.getCategories().length,
      lastUpdated: this.lastFetchTime,
      fetchErrors: this.fetchErrors.length,
      breakingCount: this.articles.filter(a => a.priorityLabel === 'breaking').length,
    };
  }
}

function extractImage(item) {
  if (item.mediaContent?.['$']?.url) return item.mediaContent['$'].url;
  if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;
  if (item.enclosure?.url) return item.enclosure.url;
  // Try to extract from content
  const imgMatch = (item.content || '').match(/<img[^>]+src=["']([^"']+)/);
  return imgMatch ? imgMatch[1] : null;
}

export const feedService = new FeedService();
