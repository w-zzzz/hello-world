/**
 * FinPulse — Financial News Intelligence
 * Frontend Application
 */

// --- State ---
const state = {
  articles: [],
  categories: [],
  currentCategory: 'all',
  currentPriority: 'all',
  currentSearch: '',
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  autoRefreshInterval: null,
};

// --- DOM Elements ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  articleGrid: $('#article-grid'),
  featuredGrid: $('#featured-grid'),
  categoryPills: $('#category-pills'),
  priorityFilter: $('#priority-filter'),
  searchInput: $('#search-input'),
  loadMoreBtn: $('#load-more-btn'),
  loadMoreWrap: $('#load-more-wrap'),
  paginationInfo: $('#pagination-info'),
  loadingState: $('#loading-state'),
  refreshBtn: $('#refresh-btn'),
  themeToggle: $('#theme-toggle'),
  modalOverlay: $('#modal-overlay'),
  modalBody: $('#modal-body'),
  modalClose: $('#modal-close'),
  tickerEl: $('#breaking-ticker'),
  tickerContent: $('#ticker-content'),
  articleCount: $('#article-count'),
  statTotal: $('#stat-total'),
  statSources: $('#stat-sources'),
  statBreaking: $('#stat-breaking'),
  statUpdated: $('#stat-updated'),
};

// --- API Layer ---
async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`/api${endpoint}`, options);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API ${endpoint}:`, err);
    return null;
  }
}

// --- Data Fetching ---
async function loadNews(append = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  if (!append) {
    showLoadingSkeletons();
  }

  const params = new URLSearchParams({
    page: state.currentPage,
    limit: 30,
  });
  if (state.currentCategory !== 'all') params.set('category', state.currentCategory);
  if (state.currentPriority !== 'all') params.set('priority', state.currentPriority);
  if (state.currentSearch) params.set('search', state.currentSearch);

  const data = await api(`/news?${params}`);
  if (!data) {
    state.isLoading = false;
    showError();
    return;
  }

  if (append) {
    state.articles.push(...data.articles);
  } else {
    state.articles = data.articles;
  }

  state.totalPages = data.pagination.pages;
  renderArticles(append);
  updatePagination(data.pagination);
  state.isLoading = false;
}

async function loadCategories() {
  const data = await api('/categories');
  if (data) {
    state.categories = data.categories;
    renderCategories();
  }
}

async function loadBreaking() {
  const data = await api('/breaking');
  if (data && data.articles.length > 0) {
    renderBreakingTicker(data.articles);
    renderFeatured(data.articles.slice(0, 2));
  }
}

async function loadStats() {
  const data = await api('/stats');
  if (data) {
    animateNumber(dom.statTotal, data.totalArticles);
    animateNumber(dom.statSources, data.sources);
    animateNumber(dom.statBreaking, data.breakingCount);
    dom.statUpdated.textContent = data.lastUpdated
      ? formatTime(data.lastUpdated)
      : '—';
    dom.articleCount.textContent = data.totalArticles;
  }
}

// --- Rendering ---
function renderArticles(append = false) {
  if (!append) {
    dom.articleGrid.innerHTML = '';
  }

  if (state.articles.length === 0) {
    dom.articleGrid.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <h3>No articles found</h3>
        <p>Try adjusting your filters or search query</p>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const article of state.articles.slice(append ? state.articles.length - 30 : 0)) {
    fragment.appendChild(createArticleCard(article));
  }

  dom.articleGrid.appendChild(fragment);
}

function createArticleCard(article) {
  const card = document.createElement('article');
  card.className = 'article-card';
  card.dataset.priority = article.priorityLabel;
  card.onclick = () => openModal(article);

  const imageHtml = article.image
    ? `<img class="card-image" src="${escapeHtml(article.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : '';

  const categoriesHtml = article.categories
    .map(c => `<span class="card-category-tag">${escapeHtml(c)}</span>`)
    .join('');

  card.innerHTML = `
    ${imageHtml}
    <div class="card-body">
      <div class="card-meta">
        <span class="card-source">${escapeHtml(article.source)}</span>
        <span class="card-time">${formatTime(article.pubDate)}</span>
      </div>
      <h3 class="card-title">${escapeHtml(article.title)}</h3>
      <p class="card-summary">${escapeHtml(article.summary)}</p>
    </div>
    <div class="card-footer">
      <div class="card-categories">${categoriesHtml}</div>
      <span class="card-priority-badge ${article.priorityLabel}">
        ${priorityIcon(article.priorityLabel)} ${article.priorityLabel}
      </span>
    </div>`;

  return card;
}

function renderFeatured(articles) {
  dom.featuredGrid.innerHTML = '';

  for (const article of articles) {
    const card = document.createElement('article');
    card.className = 'featured-card';
    card.onclick = () => openModal(article);

    const imageHtml = article.image
      ? `<img class="card-image" src="${escapeHtml(article.image)}" alt="" loading="lazy" onerror="this.parentElement.style.gridTemplateColumns='1fr'">`
      : '';

    card.innerHTML = `
      ${imageHtml || '<div style="display:none"></div>'}
      <div class="card-body">
        <div class="featured-badge"><span class="pulse-dot"></span> Breaking</div>
        <div class="card-meta">
          <span class="card-source">${escapeHtml(article.source)}</span>
          <span class="card-time">${formatTime(article.pubDate)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(article.title)}</h3>
        <p class="card-summary">${escapeHtml(article.summary)}</p>
      </div>`;

    if (!article.image) {
      card.style.gridTemplateColumns = '1fr';
    }

    dom.featuredGrid.appendChild(card);
  }
}

function renderCategories() {
  dom.categoryPills.innerHTML = `
    <button class="pill ${state.currentCategory === 'all' ? 'active' : ''}" data-category="all">
      All News
    </button>`;

  const categoryIcons = {
    'Markets': '📈', 'Economy': '🏛️', 'Federal Reserve': '🏦', 'Banking': '💳',
    'Crypto': '₿', 'Commodities': '🛢️', 'Tech': '💻', 'Real Estate': '🏠',
    'Earnings': '📊', 'Geopolitics': '🌍', 'Energy': '⚡', 'Regulation': '⚖️',
    'General': '📰',
  };

  for (const cat of state.categories) {
    const btn = document.createElement('button');
    btn.className = `pill ${state.currentCategory === cat.name ? 'active' : ''}`;
    btn.dataset.category = cat.name;
    btn.innerHTML = `${categoryIcons[cat.name] || '📄'} ${cat.name} <span class="pill-count">${cat.count}</span>`;
    btn.onclick = () => selectCategory(cat.name);
    dom.categoryPills.appendChild(btn);
  }
}

function renderBreakingTicker(articles) {
  if (articles.length === 0) {
    dom.tickerEl.hidden = true;
    return;
  }

  dom.tickerEl.hidden = false;
  // Duplicate for seamless loop
  const items = [...articles, ...articles]
    .map(a => `<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>`)
    .join('');
  dom.tickerContent.innerHTML = items;
}

function showLoadingSkeletons() {
  dom.articleGrid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-line h-lg w-75"></div>
      <div class="skeleton skeleton-line w-100"></div>
      <div class="skeleton skeleton-line w-100"></div>
      <div class="skeleton skeleton-line w-50"></div>
    </div>`).join('');
}

function showError() {
  dom.articleGrid.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
      </svg>
      <h3>Failed to load news</h3>
      <p>Please check your connection and try refreshing</p>
    </div>`;
}

function updatePagination({ page, total, pages }) {
  if (pages <= 1 || page >= pages) {
    dom.loadMoreWrap.hidden = true;
  } else {
    dom.loadMoreWrap.hidden = false;
    dom.paginationInfo.textContent = `Showing ${Math.min(page * 30, total)} of ${total} articles`;
  }
}

// --- Modal ---
function openModal(article) {
  const categoriesHtml = article.categories
    .map(c => `<span class="modal-tag">${escapeHtml(c)}</span>`)
    .join('');

  dom.modalBody.innerHTML = `
    <p class="modal-source">${escapeHtml(article.source)}</p>
    <h2 class="modal-title">${escapeHtml(article.title)}</h2>
    <div class="modal-meta">
      <span>${formatTime(article.pubDate)}</span>
      <span>·</span>
      <span>${escapeHtml(article.author)}</span>
      <span>·</span>
      <span class="card-priority-badge ${article.priorityLabel}">
        ${priorityIcon(article.priorityLabel)} Score: ${article.priorityScore}
      </span>
    </div>
    <p class="modal-summary">${escapeHtml(article.summary || article.content)}</p>
    <div class="modal-tags">${categoriesHtml}</div>
    <a class="modal-link" href="${escapeHtml(article.link)}" target="_blank" rel="noopener">
      Read Full Article →
    </a>`;

  dom.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modalOverlay.hidden = true;
  document.body.style.overflow = '';
}

// --- Interactions ---
function selectCategory(category) {
  state.currentCategory = category;
  state.currentPage = 1;
  state.articles = [];

  // Update pill active states
  for (const pill of dom.categoryPills.children) {
    pill.classList.toggle('active', pill.dataset.category === category);
  }

  loadNews();
}

let searchTimeout;
function handleSearch(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.currentSearch = e.target.value.trim();
    state.currentPage = 1;
    state.articles = [];
    loadNews();
  }, 350);
}

function handlePriorityChange(e) {
  state.currentPriority = e.target.value;
  state.currentPage = 1;
  state.articles = [];
  loadNews();
}

function handleLoadMore() {
  state.currentPage++;
  loadNews(true);
}

async function handleRefresh() {
  dom.refreshBtn.classList.add('spinning');
  await api('/refresh', { method: 'POST' });
  await Promise.all([loadNews(), loadCategories(), loadBreaking(), loadStats()]);
  dom.refreshBtn.classList.remove('spinning');
}

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('finpulse-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('finpulse-theme', next);
}

// --- Utilities ---
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function priorityIcon(label) {
  const icons = { breaking: '🔴', high: '🟠', medium: '🟡', standard: '⚪' };
  return icons[label] || '⚪';
}

function animateNumber(el, target) {
  const duration = 600;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// --- Keyboard Shortcuts ---
function handleKeyboard(e) {
  // Cmd/Ctrl + K for search focus
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    dom.searchInput.focus();
    dom.searchInput.select();
  }
  // Escape to close modal
  if (e.key === 'Escape') {
    closeModal();
  }
}

// --- Auto-refresh ---
function startAutoRefresh() {
  state.autoRefreshInterval = setInterval(async () => {
    await Promise.all([loadNews(), loadCategories(), loadBreaking(), loadStats()]);
  }, 10 * 60 * 1000); // every 10 min
}

// --- Initialize ---
async function init() {
  initTheme();

  // Event listeners
  dom.searchInput.addEventListener('input', handleSearch);
  dom.priorityFilter.addEventListener('change', handlePriorityChange);
  dom.loadMoreBtn.addEventListener('click', handleLoadMore);
  dom.refreshBtn.addEventListener('click', handleRefresh);
  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.modalClose.addEventListener('click', closeModal);
  dom.modalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.modalOverlay) closeModal();
  });
  document.addEventListener('keydown', handleKeyboard);

  // Initial "All News" pill click handler
  dom.categoryPills.querySelector('[data-category="all"]').onclick = () => selectCategory('all');

  // Load data in parallel
  await Promise.all([
    loadNews(),
    loadCategories(),
    loadBreaking(),
    loadStats(),
  ]);

  // Start auto-refresh
  startAutoRefresh();
}

init();
