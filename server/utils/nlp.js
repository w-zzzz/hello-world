// Keyword-based categorization and NLP utilities for financial news

const CATEGORY_KEYWORDS = {
  'Markets': [
    'stock', 'stocks', 'market', 'markets', 'equity', 'equities', 's&p', 'dow', 'nasdaq',
    'bull', 'bear', 'rally', 'selloff', 'sell-off', 'trading', 'index', 'indices',
    'wall street', 'nyse', 'share price', 'market cap', 'ipo', 'listing'
  ],
  'Economy': [
    'economy', 'economic', 'gdp', 'inflation', 'deflation', 'recession', 'growth',
    'unemployment', 'jobs', 'payroll', 'labor', 'consumer spending', 'retail sales',
    'manufacturing', 'pmi', 'cpi', 'pce', 'trade deficit', 'trade surplus', 'fiscal'
  ],
  'Federal Reserve': [
    'fed', 'federal reserve', 'fomc', 'interest rate', 'rate hike', 'rate cut',
    'monetary policy', 'powell', 'quantitative', 'tightening', 'easing', 'tapering',
    'basis points', 'yield curve', 'treasury yield', 'central bank'
  ],
  'Banking': [
    'bank', 'banking', 'jpmorgan', 'goldman', 'citi', 'wells fargo', 'morgan stanley',
    'credit', 'lending', 'loan', 'mortgage', 'deposit', 'fintech', 'neobank',
    'banking crisis', 'bank failure', 'fdic', 'silicon valley bank'
  ],
  'Crypto': [
    'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'blockchain', 'defi',
    'nft', 'token', 'altcoin', 'binance', 'coinbase', 'web3', 'stablecoin',
    'mining', 'halving', 'solana', 'xrp', 'dogecoin'
  ],
  'Commodities': [
    'oil', 'gold', 'silver', 'crude', 'brent', 'wti', 'natural gas', 'copper',
    'commodity', 'commodities', 'opec', 'precious metals', 'wheat', 'corn',
    'lumber', 'iron ore', 'lithium', 'uranium'
  ],
  'Tech': [
    'apple', 'google', 'microsoft', 'amazon', 'meta', 'nvidia', 'tesla', 'ai ',
    'artificial intelligence', 'semiconductor', 'chip', 'tech', 'technology',
    'software', 'saas', 'cloud computing', 'data center', 'openai'
  ],
  'Real Estate': [
    'real estate', 'housing', 'home sales', 'mortgage rate', 'property',
    'commercial real estate', 'reit', 'rent', 'home price', 'construction',
    'building permits', 'housing starts'
  ],
  'Earnings': [
    'earnings', 'revenue', 'profit', 'quarterly', 'annual report', 'guidance',
    'eps', 'beat expectations', 'miss expectations', 'outlook', 'forecast',
    'financial results', 'earnings call'
  ],
  'Geopolitics': [
    'china', 'russia', 'ukraine', 'tariff', 'sanctions', 'trade war',
    'geopolitical', 'eu ', 'european union', 'brexit', 'nato', 'opec',
    'emerging markets', 'brics', 'g7', 'g20', 'middle east'
  ],
  'Energy': [
    'energy', 'renewable', 'solar', 'wind', 'nuclear', 'electric vehicle',
    'ev ', 'battery', 'clean energy', 'carbon', 'emission', 'climate',
    'green energy', 'hydrogen', 'power grid'
  ],
  'Regulation': [
    'sec', 'regulation', 'regulatory', 'compliance', 'antitrust', 'lawsuit',
    'investigation', 'fine', 'penalty', 'congress', 'legislation', 'bill',
    'oversight', 'subpoena', 'fraud'
  ],
};

const BREAKING_KEYWORDS = [
  'breaking', 'urgent', 'flash', 'alert', 'just in', 'developing',
  'exclusive', 'emergency', 'crisis', 'crash', 'surge', 'plunge',
  'record high', 'record low', 'all-time', 'unprecedented', 'shock',
  'collapse', 'bankrupt', 'default', 'bailout'
];

const HIGH_IMPACT_KEYWORDS = [
  'fed', 'federal reserve', 'interest rate', 'inflation', 'gdp',
  'recession', 'earnings', 'ipo', 'merger', 'acquisition',
  'billion', 'trillion', 'sanctions', 'tariff', 'regulation'
];

/**
 * Categorize an article based on title and content keywords
 */
export function categorizeArticle(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const matched = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((sum, kw) => {
      const titleHit = title.toLowerCase().includes(kw) ? 3 : 0;
      const contentHit = text.includes(kw) ? 1 : 0;
      return sum + titleHit + contentHit;
    }, 0);

    if (score >= 2) {
      matched.push({ category, score });
    }
  }

  if (matched.length === 0) {
    return ['General'];
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(m => m.category);
}

/**
 * Score article priority (0-100) based on multiple signals
 */
export function scorePriority(item, sourceTier, categories) {
  let score = 0;
  const title = (item.title || '').toLowerCase();
  const content = (item.contentSnippet || item.content || '').toLowerCase();
  const text = `${title} ${content}`;

  // Source tier bonus (tier 1 = +20, tier 2 = +12, tier 3 = +5)
  score += sourceTier === 1 ? 20 : sourceTier === 2 ? 12 : 5;

  // Breaking keywords in title (+30 each, max 30)
  const breakingHits = BREAKING_KEYWORDS.filter(kw => title.includes(kw));
  score += Math.min(breakingHits.length * 30, 30);

  // High-impact keywords (+8 each, max 24)
  const impactHits = HIGH_IMPACT_KEYWORDS.filter(kw => text.includes(kw));
  score += Math.min(impactHits.length * 8, 24);

  // Recency bonus (articles < 2 hours get +15, < 6 hours +10, < 12 hours +5)
  const pubDate = new Date(item.pubDate || item.isoDate);
  const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 2) score += 15;
  else if (hoursAgo < 6) score += 10;
  else if (hoursAgo < 12) score += 5;

  // Multi-category relevance bonus
  if (categories.length >= 3) score += 8;
  else if (categories.length >= 2) score += 4;

  // Federal Reserve / major policy always high priority
  if (categories.includes('Federal Reserve')) score += 10;

  return Math.min(Math.round(score), 100);
}

/**
 * Generate a concise summary from article content
 */
export function generateSummary(content) {
  if (!content) return '';

  // Strip HTML tags
  let text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Take first 2-3 sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.substring(0, 200);

  const summary = sentences.slice(0, 3).join(' ').trim();
  return summary.length > 300 ? summary.substring(0, 297) + '...' : summary;
}
