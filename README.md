# High School Student Management System

A complete Student Management System built with MySQL, Node.js/Express, and Vanilla JavaScript.

## Features

- **Dashboard**: Real-time statistics and quick actions
- **Attendance Management**: Daily attendance marking with update-safe saves
- **Grade Management**: Grade tracking with a sync API
- **Student Directory**: Searchable student records and class assignments
- **Authentication**: JWT-based login
- **Responsive Design**: Desktop, tablet, and mobile friendly

## Prerequisites

- Node.js v16+ and npm
- MySQL 8.0+
- Modern web browser

## Installation & Setup

### 1. Database Setup

```bash
mysql -u root -p
source database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend

Open `frontend/index.html` in a browser while the backend is running on `http://localhost:5000`.
