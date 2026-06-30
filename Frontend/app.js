// ===== CONFIG =====
const API_URL = 'http://localhost:3000/api';

// ===== STATE =====
let currentUser = null;
let currentPage = 'home';
let products = [];
let categories = [];
let favorites = [];
let filters = {
  category: '',
  search: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  location: '',
  sort: 'newest'
};

// ===== DOM ELEMENTS =====
const app = document.getElementById('app');

// ===== AUTH UTILS =====
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;
  } else {
    localStorage.removeItem('user');
    currentUser = null;
  }
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await fetch(url, options);
  if (response.status === 401) {
    setToken(null);
    setUser(null);
    showToast('Session expired. Please login again.', 'error');
    navigateTo('login');
    return null;
  }
  return response;
}

// ===== NAVIGATION =====
function navigateTo(page, params = {}) {
  currentPage = page;
  window.scrollTo(0, 0);
  
  switch (page) {
    case 'home': renderHome(); break;
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'product': renderProductDetail(params.id); break;
    case 'new-listing': renderNewListing(); break;
    case 'dashboard': renderDashboard(); break;
    case 'favorites': renderFavorites(); break;
  }
  
  updateHeader();
}

// ===== HEADER =====
function updateHeader() {
  const user = getUser();
  const header = document.querySelector('.header');
  if (!header) return;
  
  const navHtml = user ? `
    <a href="#" class="nav-link ${currentPage === 'home' ? 'active' : ''}" onclick="navigateTo('home'); return false;">Browse</a>
    <a href="#" class="nav-link ${currentPage === 'favorites' ? 'active' : ''}" onclick="navigateTo('favorites'); return false;">Favorites</a>
    <a href="#" class="nav-link ${currentPage === 'new-listing' ? 'active' : ''}" onclick="navigateTo('new-listing'); return false;">Sell Item</a>
    <a href="#" class="nav-link ${currentPage === 'dashboard' ? 'active' : ''}" onclick="navigateTo('dashboard'); return false;">My Listings</a>
  ` : `
    <a href="#" class="nav-link ${currentPage === 'home' ? 'active' : ''}" onclick="navigateTo('home'); return false;">Browse</a>
  `;
  
  const actionsHtml = user ? `
    <div class="user-avatar" onclick="navigateTo('dashboard'); return false;" title="${user.name}">
      ${user.name.charAt(0).toUpperCase()}
    </div>
    <button class="btn btn-secondary btn-sm" onclick="logout(); return false;">Logout</button>
  ` : `
    <button class="btn btn-ghost" onclick="navigateTo('login'); return false;">Sign In</button>
    <button class="btn btn-primary btn-sm" onclick="navigateTo('register'); return false;">Get Started</button>
  `;
  
  header.innerHTML = `
    <div class="header-inner">
      <a href="#" class="logo" onclick="navigateTo('home'); return false;">
        <div class="logo-icon">🏪</div>
        MarketPlace
      </a>
      <nav class="nav" id="mainNav">${navHtml}</nav>
      <div class="header-actions">
        ${actionsHtml}
        <button class="mobile-menu-btn btn-ghost" onclick="toggleMobileMenu()">☰</button>
      </div>
    </div>
  `;
}

function toggleMobileMenu() {
  const nav = document.getElementById('mainNav');
  nav.classList.toggle('active');
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== LOADING =====
function showLoading() {
  app.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:60vh;">
      <div class="spinner" style="width:48px;height:48px;"></div>
    </div>
  `;
}

// ===== FORMATTERS =====
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function getConditionLabel(condition) {
  const labels = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
  };
  return labels[condition] || condition;
}

// ===== RENDER HOME =====
async function renderHome() {
  showLoading();
  
  // Load categories and products in parallel
  const [categoriesRes, productsRes, statsRes] = await Promise.all([
    fetch(`${API_URL}/categories`),
    fetch(`${API_URL}/products?${new URLSearchParams(filters)}`),
    fetch(`${API_URL}/stats`)
  ]);
  
  categories = await categoriesRes.json();
  const productsData = await productsRes.json();
  products = productsData.products || [];
  const stats = await statsRes.json();
  
  app.innerHTML = `
    <div class="hero">
      <div class="container">
        <h1 class="hero-title">Discover Amazing Deals</h1>
        <p class="hero-subtitle">Buy and sell products in your local community. No fees, no hassle.</p>
        <div class="hero-search">
          <div class="search-box">
            <input type="text" class="search-input" placeholder="Search for products..." 
              value="${filters.search}" id="heroSearch" onkeypress="if(event.key==='Enter')applySearch()">
            <button class="search-btn" onclick="applySearch()">🔍 Search</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-value">${stats.total_products || 0}</div>
            <div class="hero-stat-label">Active Listings</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">${stats.total_users || 0}</div>
            <div class="hero-stat-label">Happy Users</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">${stats.total_categories || 0}</div>
            <div class="hero-stat-label">Categories</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="categories-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Browse Categories</h2>
        </div>
        <div class="categories-grid">
          ${categories.map(cat => `
            <div class="category-card ${filters.category == cat.id ? 'active' : ''}" 
                 onclick="setCategory(${cat.id})" style="border-top: 3px solid ${cat.color}">
              <div class="category-icon">${cat.icon}</div>
              <div class="category-name">${cat.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="filters-bar">
      <div class="container">
        <div class="filters-inner">
          <select class="filter-select" onchange="setSort(this.value)">
            <option value="newest" ${filters.sort === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="price_asc" ${filters.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price_desc" ${filters.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
            <option value="popular" ${filters.sort === 'popular' ? 'selected' : ''}>Most Viewed</option>
          </select>
          
          <select class="filter-select" onchange="setCondition(this.value)">
            <option value="">All Conditions</option>
            <option value="new" ${filters.condition === 'new' ? 'selected' : ''}>New</option>
            <option value="like_new" ${filters.condition === 'like_new' ? 'selected' : ''}>Like New</option>
            <option value="good" ${filters.condition === 'good' ? 'selected' : ''}>Good</option>
            <option value="fair" ${filters.condition === 'fair' ? 'selected' : ''}>Fair</option>
            <option value="poor" ${filters.condition === 'poor' ? 'selected' : ''}>Poor</option>
          </select>
          
          <div class="price-range">
            <input type="number" class="price-input" placeholder="Min $" 
              value="${filters.minPrice}" id="minPrice" onchange="setMinPrice(this.value)">
            <span>-</span>
            <input type="number" class="price-input" placeholder="Max $" 
              value="${filters.maxPrice}" id="maxPrice" onchange="setMaxPrice(this.value)">
          </div>
          
          <input type="text" class="price-input" placeholder="Location..." 
            value="${filters.location}" id="locationFilter" onchange="setLocation(this.value)" style="width:150px;">
          
          ${filters.category || filters.search || filters.minPrice || filters.maxPrice || filters.condition || filters.location ? `
            <button class="btn btn-ghost btn-sm" onclick="clearFilters()">Clear Filters</button>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div class="products-section">
      <div class="container">
        <div class="products-grid">
          ${products.length > 0 ? products.map(product => renderProductCard(product)).join('') : `
            <div class="empty-state" style="grid-column: 1 / -1;">
              <div class="empty-state-icon">📭</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
            </div>
          `}
        </div>
      </div>
    </div>
    
    ${renderFooter()}
  `;
  
  // Load favorites if logged in
  if (getToken()) {
    loadFavorites();
  }
}

function renderProductCard(product) {
  const isFav = favorites.includes(product.id);
  const image = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/400x300?text=No+Image';
  
  return `
    <div class="product-card" onclick="navigateTo('product', {id: ${product.id}})">
      <div class="product-image">
        <img src="${image}" alt="${product.title}" loading="lazy">
        <button class="product-favorite ${isFav ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleFavorite(${product.id})" title="${isFav ? 'Remove from' : 'Add to'} favorites">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="product-badge">
          <span class="badge badge-${product.condition}">${getConditionLabel(product.condition)}</span>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-meta">
          <span class="product-location">📍 ${product.location || 'Unknown'}</span>
          <span class="product-views">👁 ${product.views || 0}</span>
        </div>
      </div>
      <div class="product-seller">
        <div class="seller-avatar">${product.seller_name ? product.seller_name.charAt(0).toUpperCase() : '?'}</div>
        <span class="seller-name">${product.seller_name || 'Unknown'}</span>
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">🏪 MarketPlace</div>
            <p class="footer-desc">The easiest way to buy and sell products in your community. No fees, no hassle.</p>
          </div>
          <div>
            <h4 class="footer-title">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="#" onclick="navigateTo('home'); return false;">Browse Products</a></li>
              <li><a href="#" onclick="navigateTo('new-listing'); return false;">Sell an Item</a></li>
              <li><a href="#" onclick="navigateTo('favorites'); return false;">My Favorites</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-title">Account</h4>
            <ul class="footer-links">
              <li><a href="#" onclick="navigateTo('login'); return false;">Sign In</a></li>
              <li><a href="#" onclick="navigateTo('register'); return false;">Create Account</a></li>
              <li><a href="#" onclick="navigateTo('dashboard'); return false;">My Listings</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 MarketPlace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

// ===== FILTER FUNCTIONS =====
function setCategory(id) {
  filters.category = filters.category == id ? '' : id;
  renderHome();
}

function setSort(value) {
  filters.sort = value;
  renderHome();
}

function setCondition(value) {
  filters.condition = value;
  renderHome();
}

function setMinPrice(value) {
  filters.minPrice = value;
  renderHome();
}

function setMaxPrice(value) {
  filters.maxPrice = value;
  renderHome();
}

function setLocation(value) {
  filters.location = value;
  renderHome();
}

function applySearch() {
  const search = document.getElementById('heroSearch').value;
  filters.search = search;
  renderHome();
}

function clearFilters() {
  filters = {
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    location: '',
    sort: 'newest'
  };
  renderHome();
}

// ===== FAVORITES =====
async function loadFavorites() {
  try {
    const response = await fetchWithAuth(`${API_URL}/favorites`);
    if (!response) return;
    const data = await response.json();
    favorites = data.map(p => p.id);
    
    // Update favorite buttons
    document.querySelectorAll('.product-favorite').forEach(btn => {
      const productId = parseInt(btn.getAttribute('onclick').match(/\\d+/)[0]);
      const isFav = favorites.includes(productId);
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? '❤️' : '🤍';
    });
  } catch (err) {
    console.error('Failed to load favorites:', err);
  }
}

async function toggleFavorite(productId) {
  if (!getToken()) {
    showToast('Please sign in to add favorites', 'warning');
    navigateTo('login');
    return;
  }
  
  const isFav = favorites.includes(productId);
  
  try {
    const response = await fetchWithAuth(`${API_URL}/favorites/${productId}`, {
      method: isFav ? 'DELETE' : 'POST'
    });
    
    if (response && response.ok) {
      if (isFav) {
        favorites = favorites.filter(id => id !== productId);
        showToast('Removed from favorites');
      } else {
        favorites.push(productId);
        showToast('Added to favorites');
      }
      
      // Update UI
      document.querySelectorAll('.product-favorite').forEach(btn => {
        const btnId = parseInt(btn.getAttribute('onclick').match(/\\d+/)[0]);
        if (btnId === productId) {
          btn.classList.toggle('active', !isFav);
          btn.innerHTML = !isFav ? '❤️' : '🤍';
        }
      });
      
      if (currentPage === 'favorites') {
        renderFavorites();
      }
    }
  } catch (err) {
    showToast('Failed to update favorites', 'error');
  }
}

// ===== PRODUCT DETAIL =====
async function renderProductDetail(id) {
  showLoading();
  
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      showToast('Product not found', 'error');
      navigateTo('home');
      return;
    }
    
    const product = await response.json();
    const images = product.images && product.images.length > 0 
      ? product.images 
      : ['https://via.placeholder.com/800x600?text=No+Image'];
    
    app.innerHTML = `
      <div class="product-detail">
        <div class="container">
          <div class="detail-grid">
            <div class="detail-images">
              <div class="detail-main-image">
                <img src="${images[0]}" alt="${product.title}" id="mainImage">
              </div>
              ${images.length > 1 ? `
                <div class="detail-thumbnails">
                  ${images.map((img, i) => `
                    <div class="detail-thumb ${i === 0 ? 'active' : ''}" onclick="setMainImage('${img}', this)">
                      <img src="${img}" alt="Thumbnail ${i + 1}">
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            
            <div class="detail-info">
              <div class="detail-header">
                <h1 class="detail-title">${product.title}</h1>
                <div class="detail-price">${formatPrice(product.price)}</div>
              </div>
              
              <div class="detail-meta">
                <span class="detail-meta-item">
                  <span class="badge badge-${product.condition}">${getConditionLabel(product.condition)}</span>
                </span>
                <span class="detail-meta-item">📍 ${product.location || 'Unknown location'}</span>
                <span class="detail-meta-item">👁 ${product.views || 0} views</span>
                <span class="detail-meta-item">📅 ${formatDate(product.created_at)}</span>
                ${product.category_name ? `<span class="detail-meta-item">🏷️ ${product.category_name}</span>` : ''}
              </div>
              
              <div class="detail-section">
                <h3 class="detail-section-title">Description</h3>
                <p class="detail-description">${product.description || 'No description provided.'}</p>
              </div>
              
              <div class="detail-section">
                <h3 class="detail-section-title">Seller Information</h3>
                <div class="detail-seller-card">
                  <div class="detail-seller-avatar">${product.seller_name ? product.seller_name.charAt(0).toUpperCase() : '?'}</div>
                  <div class="detail-seller-info">
                    <h4>${product.seller_name || 'Unknown'}</h4>
                    <p>📍 ${product.seller_location || 'Location unknown'} • Member since ${formatDate(product.seller_since)}</p>
                  </div>
                </div>
              </div>
              
              <div class="detail-actions">
                <button class="btn btn-primary btn-lg" onclick="contactSeller('${product.seller_phone || ''}', '${product.seller_email || ''}')">
                  📞 Contact Seller
                </button>
                <button class="btn btn-secondary btn-lg" onclick="toggleFavorite(${product.id})">
                  ${favorites.includes(product.id) ? '❤️ Saved' : '🤍 Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      ${renderFooter()}
    `;
  } catch (err) {
    showToast('Failed to load product', 'error');
    navigateTo('home');
  }
}

function setMainImage(src, thumb) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function contactSeller(phone, email) {
  if (!phone && !email) {
    showToast('Seller contact info not available', 'warning');
    return;
  }
  
  const contactInfo = [];
  if (phone) contactInfo.push(`📞 Phone: ${phone}`);
  if (email) contactInfo.push(`📧 Email: ${email}`);
  
  showModal('Contact Seller', `
    <div style="text-align:center; padding: 1rem 0;">
      <p style="margin-bottom: 1.5rem; color: var(--gray-600);">Reach out to the seller using the information below:</p>
      ${contactInfo.map(info => `<p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius);">${info}</p>`).join('')}
      ${phone ? `<a href="tel:${phone}" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Call Now</a>` : ''}
    </div>
  `);
}

// ===== AUTH PAGES =====
function renderLogin() {
  app.innerHTML = `
    <div class="form-page">
      <div class="form-card">
        <h1 class="form-title">Welcome Back</h1>
        <p class="form-subtitle">Sign in to your account to continue</p>
        
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="loginEmail" required placeholder="you@example.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="loginPassword" required placeholder="••••••••">
          </div>
          
          <button type="submit" class="form-submit" id="loginBtn">Sign In</button>
        </form>
        
        <p class="form-footer">
          Don't have an account? <a href="#" onclick="navigateTo('register'); return false;">Create one</a>
        </p>
        
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); text-align: center;">
          <p style="font-size: 0.75rem; color: var(--gray-400); margin-bottom: 0.5rem;">Demo Accounts:</p>
          <p style="font-size: 0.75rem; color: var(--gray-500);">john@example.com / password123</p>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Signing in...';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setToken(data.token);
      setUser(data.user);
      showToast('Welcome back, ' + data.user.name + '!');
      navigateTo('home');
    } else {
      showToast(data.error || 'Login failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

function renderRegister() {
  app.innerHTML = `
    <div class="form-page">
      <div class="form-card">
        <h1 class="form-title">Create Account</h1>
        <p class="form-subtitle">Join our community of buyers and sellers</p>
        
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="regName" required placeholder="John Doe">
          </div>
          
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="regEmail" required placeholder="you@example.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="regPassword" required placeholder="Min 6 characters" minlength="6">
          </div>
          
          <div class="form-group">
            <label class="form-label">Phone (optional)</label>
            <input type="tel" class="form-input" id="regPhone" placeholder="+1 555-0100">
          </div>
          
          <div class="form-group">
            <label class="form-label">Location (optional)</label>
            <input type="text" class="form-input" id="regLocation" placeholder="City, State">
          </div>
          
          <button type="submit" class="form-submit" id="regBtn">Create Account</button>
        </form>
        
        <p class="form-footer">
          Already have an account? <a href="#" onclick="navigateTo('login'); return false;">Sign in</a>
        </p>
      </div>
    </div>
  `;
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Creating account...';
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        location: document.getElementById('regLocation').value
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setToken(data.token);
      setUser(data.user);
      showToast('Welcome, ' + data.user.name + '!');
      navigateTo('home');
    } else {
      showToast(data.error || 'Registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function logout() {
  setToken(null);
  setUser(null);
  favorites = [];
  showToast('Logged out successfully');
  navigateTo('home');
}

// ===== NEW LISTING =====
async function renderNewListing() {
  if (!getToken()) {
    showToast('Please sign in to list a product', 'warning');
    navigateTo('login');
    return;
  }
  
  // Load categories
  const catResponse = await fetch(`${API_URL}/categories`);
  categories = await catResponse.json();
  
  app.innerHTML = `
    <div class="listing-form">
      <div class="listing-form-card">
        <h1 class="form-title" style="text-align:left;">List Your Item</h1>
        <p class="form-subtitle" style="text-align:left;">Fill in the details below to create your listing</p>
        
        <form onsubmit="handleCreateListing(event)" enctype="multipart/form-data">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="listingTitle" required placeholder="What are you selling?" maxlength="100">
          </div>
          
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="listingDescription" placeholder="Describe your item in detail..." maxlength="2000"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Price *</label>
              <input type="number" class="form-input" id="listingPrice" required placeholder="0.00" min="0" step="0.01">
            </div>
            
            <div class="form-group">
              <label class="form-label">Condition *</label>
              <select class="form-select" id="listingCondition" required>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good" selected>Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="listingCategory">
                <option value="">Select a category</option>
                ${categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-input" id="listingLocation" placeholder="City, State">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Photos</label>
            <div class="image-upload" onclick="document.getElementById('listingImages').click()">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
              <p style="font-weight: 600; color: var(--gray-700);">Click to upload photos</p>
              <p class="form-hint">Up to 5 images, max 5MB each</p>
              <input type="file" id="listingImages" accept="image/*" multiple onchange="handleImagePreview(this)">
            </div>
            <div class="upload-preview" id="imagePreview"></div>
          </div>
          
          <button type="submit" class="form-submit" id="listingBtn">Create Listing</button>
        </form>
      </div>
    </div>
    
    ${renderFooter()}
  `;
}

let selectedImages = [];

function handleImagePreview(input) {
  selectedImages = Array.from(input.files);
  const preview = document.getElementById('imagePreview');
  
  preview.innerHTML = selectedImages.map((file, i) => `
    <div class="upload-preview-item">
      <img src="${URL.createObjectURL(file)}" alt="Preview ${i + 1}">
      <button type="button" class="upload-preview-remove" onclick="removeImage(${i})">×</button>
    </div>
  `).join('');
}

function removeImage(index) {
  selectedImages.splice(index, 1);
  
  // Recreate file input
  const input = document.getElementById('listingImages');
  const dt = new DataTransfer();
  selectedImages.forEach(file => dt.items.add(file));
  input.files = dt.files;
  
  handleImagePreview(input);
}

async function handleCreateListing(e) {
  e.preventDefault();
  const btn = document.getElementById('listingBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Creating...';
  
  const formData = new FormData();
  formData.append('title', document.getElementById('listingTitle').value);
  formData.append('description', document.getElementById('listingDescription').value);
  formData.append('price', document.getElementById('listingPrice').value);
  formData.append('condition', document.getElementById('listingCondition').value);
  formData.append('category_id', document.getElementById('listingCategory').value);
  formData.append('location', document.getElementById('listingLocation').value);
  
  selectedImages.forEach(file => {
    formData.append('images', file);
  });
  
  try {
    const response = await fetchWithAuth(`${API_URL}/products`, {
      method: 'POST',
      body: formData
    });
    
    if (response && response.ok) {
      const product = await response.json();
      showToast('Listing created successfully!');
      selectedImages = [];
      navigateTo('product', { id: product.id });
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to create listing', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Listing';
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Listing';
  }
}

// ===== DASHBOARD =====
async function renderDashboard() {
  if (!getToken()) {
    showToast('Please sign in to view your listings', 'warning');
    navigateTo('login');
    return;
  }
  
  showLoading();
  
  try {
    const response = await fetchWithAuth(`${API_URL}/seller/products`);
    if (!response) return;
    
    const myProducts = await response.json();
    
    app.innerHTML = `
      <div class="dashboard">
        <div class="container">
          <div class="dashboard-header">
            <h1 class="dashboard-title">My Listings</h1>
            <button class="btn btn-primary" onclick="navigateTo('new-listing')">
              ➕ New Listing
            </button>
          </div>
          
          ${myProducts.length > 0 ? `
            <div class="listings-table">
              <div class="listings-table-header">
                <span>Product</span>
                <span>Price</span>
                <span>Status</span>
                <span>Views</span>
                <span>Actions</span>
              </div>
              ${myProducts.map(product => `
                <div class="listing-row">
                  <div class="listing-row-info">
                    <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/56?text=No+Image'}" 
                         class="listing-row-img" alt="${product.title}">
                    <div>
                      <div class="listing-row-title">${product.title}</div>
                      <div class="listing-row-category">${product.category_name || 'Uncategorized'}</div>
                    </div>
                  </div>
                  <div class="listing-row-price">${formatPrice(product.price)}</div>
                  <div>
                    <span class="badge badge-${product.status === 'active' ? 'new' : product.status === 'sold' ? 'good' : 'fair'}">
                      ${product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </div>
                  <div>${product.views || 0}</div>
                  <div class="listing-row-actions">
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('product', {id: ${product.id}})">View</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteListing(${product.id})">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <h3>No listings yet</h3>
              <p>Start selling by creating your first listing</p>
              <button class="btn btn-primary" onclick="navigateTo('new-listing')">Create Listing</button>
            </div>
          `}
        </div>
      </div>
      
      ${renderFooter()}
    `;
  } catch (err) {
    showToast('Failed to load listings', 'error');
  }
}

async function deleteListing(id) {
  if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
  
  try {
    const response = await fetchWithAuth(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });
    
    if (response && response.ok) {
      showToast('Listing deleted');
      renderDashboard();
    } else {
      showToast('Failed to delete listing', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// ===== FAVORITES PAGE =====
async function renderFavorites() {
  if (!getToken()) {
    showToast('Please sign in to view favorites', 'warning');
    navigateTo('login');
    return;
  }
  
  showLoading();
  
  try {
    const response = await fetchWithAuth(`${API_URL}/favorites`);
    if (!response) return;
    
    const favProducts = await response.json();
    
    app.innerHTML = `
      <div class="products-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">My Favorites ❤️</h2>
          </div>
          
          ${favProducts.length > 0 ? `
            <div class="products-grid">
              ${favProducts.map(product => renderProductCard(product)).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">🤍</div>
              <h3>No favorites yet</h3>
              <p>Browse products and click the heart icon to save them here</p>
              <button class="btn btn-primary" onclick="navigateTo('home')">Browse Products</button>
            </div>
          `}
        </div>
      </div>
      
      ${renderFooter()}
    `;
    
    favorites = favProducts.map(p => p.id);
  } catch (err) {
    showToast('Failed to load favorites', 'error');
  }
}

// ===== MODAL =====
function showModal(title, content) {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">${content}</div>
    </div>
  `;
  
  // Force reflow
  overlay.offsetHeight;
  overlay.classList.add('active');
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

// ===== INIT =====
function init() {
  currentUser = getUser();
  
  // Check for stored page
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('product/')) {
    const id = hash.split('/')[1];
    navigateTo('product', { id: parseInt(id) });
  } else {
    navigateTo('home');
  }
  
  // Handle back button
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('product/')) {
      const id = hash.split('/')[1];
      navigateTo('product', { id: parseInt(id) });
    } else {
      navigateTo(hash || 'home');
    }
  });
}
init();