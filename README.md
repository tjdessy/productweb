
# 8. BACKEND - README.md
readme_md = '''# MarketPlace - Product Listing Website

A full-stack product listing marketplace where sellers can list their products and buyers can browse, search, and contact sellers directly. No payment processing — just pure listing and discovery.

## Features

- **User Authentication** — Register/login with JWT tokens
- **Product Listings** — Create, edit, delete listings with images
- **Browse & Search** — Filter by category, price, condition, location
- **Favorites** — Save products to your favorites list
- **Seller Profiles** — View seller info and their other listings
- **Contact Seller** — Direct phone/email contact (no in-app messaging)
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Backend:** Node.js, Express, SQLite
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (no frameworks!)
- **Authentication:** JWT + bcrypt
- **File Uploads:** Multer for image uploads

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Seed the Database

```bash
node seed.js
```

This creates 5 demo users and 15 sample products.

### 3. Start the Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The API will run on `http://localhost:3000`

### 4. Serve the Frontend

The frontend is pure HTML/CSS/JS. You can serve it with any static file server:

```bash
cd frontend
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js (install serve globally first: npm i -g serve)
serve -l 8080

# Option 3: VS Code Live Server extension
```

Then open `http://localhost:8080` in your browser.

## Demo Accounts

| Email | Password | Name |
|-------|----------|------|
| john@example.com | password123 | John Smith |
| sarah@example.com | password123 | Sarah Johnson |
| mike@example.com | password123 | Mike Chen |
| emily@example.com | password123 | Emily Davis |
| alex@example.com | password123 | Alex Wilson |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user (requires auth)

### Categories
- `GET /api/categories` — List all categories

### Products
- `GET /api/products` — List products (with query filters)
- `GET /api/products/:id` — Get single product
- `POST /api/products` — Create product (requires auth + images)
- `PUT /api/products/:id` — Update product (requires auth)
- `DELETE /api/products/:id` — Delete product (requires auth)
- `GET /api/seller/products` — Get my listings (requires auth)
- `GET /api/seller/:id/products` — Get seller's public listings

### Favorites
- `GET /api/favorites` — Get my favorites (requires auth)
- `POST /api/favorites/:productId` — Add to favorites (requires auth)
- `DELETE /api/favorites/:productId` — Remove from favorites (requires auth)

### Stats
- `GET /api/stats` — Get platform stats

## Query Parameters for Products

- `category` — Filter by category ID
- `search` — Search in title/description
- `minPrice` / `maxPrice` — Price range
- `condition` — Filter by condition (new, like_new, good, fair, poor)
- `location` — Filter by location
- `sort` — Sort by: newest, price_asc, price_desc, popular, oldest
- `page` / `limit` — Pagination

## Project Structure

```
product-listing-site/
├── backend/
│   ├── server.js          # Express server & API routes
│   ├── db.js              # SQLite database setup
│   ├── seed.js            # Demo data seeder
│   ├── package.json       # Dependencies
│   └── uploads/           # Uploaded images
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── style.css          # All styles
│   └── app.js             # All frontend logic
└── README.md
```

## Customization

- **Change port:** Edit `PORT` in `backend/server.js`
- **Change API URL:** Edit `API_URL` in `frontend/app.js`
- **Add categories:** Edit the categories array in `backend/db.js`
- **Styling:** All CSS variables are at the top of `frontend/style.css`

## License

MIT
'''

with open('/mnt/agents/output/product-listing-site/README.md', 'w') as f:
    f.write(readme_md)

print("README.md created!")
