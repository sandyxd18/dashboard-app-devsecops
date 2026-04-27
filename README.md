# 📊 Bookstore Admin Dashboard

A premium, high-performance administrative interface for managing the Bookstore microservices ecosystem. Built with **React**, **Vite**, and **Zustand**, featuring a sleek dark-themed design and full integration with the backend microservices.

---

## ✨ Features

- **📈 Overview Hub**: Real-time statistics for total users, books, orders, and revenue.
- **📚 Book Management**: Complete CRUD suite for the book catalog, including cover image uploads to MinIO.
- **👥 User Administration**: Monitor registered users, manage account deletions, and perform administrative password resets.
- **🛒 Order Tracking**: Detailed view of all customer orders with the ability to manually update statuses.
- **⛓️ Blockchain Audit**: Transparent view of the immutable ledger, allowing admins to verify the integrity of the entire transaction chain.
- **🔐 Admin Security**: Profile management with secure password updates and recovery key generation.
- **🛡️ RBAC & Auth**: Secure admin-only access with prioritized Bearer token authentication and HttpOnly cookie support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 |
| **Build Tool** | Vite |
| **State Management** | Zustand |
| **Styling** | Vanilla CSS (Premium Dark Theme) |
| **Icons** | Material Symbols Outlined |
| **API Client** | Axios |
| **Deployment** | Docker |

---

## 📂 Project Structure

```
dashboard/
├── src/
│   ├── components/       # Reusable UI components (Modals, Loaders, Sidebar)
│   ├── layouts/          # Main dashboard layout wrapper
│   ├── pages/            # Feature-specific page components
│   ├── services/         # Axios API clients for each microservice
│   ├── store/            # Zustand state stores (Admin & Auth)
│   ├── App.jsx           # Main routing and entry point
│   └── index.css         # Global styles and design system
├── public/               # Static assets (Favicon)
├── .env.example          # Environment variable template
└── Dockerfile            # Production build & Nginx serving
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Access to the microservices ecosystem (Auth, Book, Order, Payment, Blockchain)

### 1. Installation

```bash
cd dashboard
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
VITE_AUTH_API_URL=http://localhost:3000
VITE_BOOK_API_URL=http://localhost:3001
VITE_ORDER_API_URL=http://localhost:3002
VITE_PAYMENT_API_URL=http://localhost:3003
VITE_BLOCKCHAIN_API_URL=http://localhost:3004
```

### 3. Development

```bash
npm run dev
```

### 4. Build & Production

```bash
npm run build
# The 'dist' folder can be served by Nginx or any static host
```

---

## 📊 Dashboard Pages

| Page | Description |
|---|---|
| **Overview** | High-level business metrics and system status. |
| **Books** | Inventory management with search and image support. |
| **Users** | User database management and account controls. |
| **Orders** | Transaction history and order fulfillment status. |
| **Blockchain** | Immutable ledger verification and chain validation. |

---

## 🎨 Design System

The dashboard uses a custom CSS design system focused on:
- **Premium Dark Mode**: Deep blues and grays for reduced eye strain.
- **Glassmorphism**: Subtle transparency and blur effects on cards and modals.
- **Aesthetic Micro-animations**: Smooth hover transitions and loading states.
- **Consistency**: Centralized CSS variables for colors, spacing, and shadows.

---

## 🛡️ Security Implementation

- **Bearer Token Persistence**: Auth tokens are stored in an in-memory Zustand store to prevent XSS-based token theft.
- **API Interceptors**: Automatically injects Authorization headers into every request.
- **Automatic Session Sync**: Cross-tabs session management via optimized cookie handling.
- **Error Boundaries**: Graceful handling of service outages with user-friendly alerts.

---

## 🐳 Docker Deployment

The dashboard is served via Nginx in production:

```bash
docker build -t bookstore-dashboard .
docker run -p 80:80 bookstore-dashboard
```
