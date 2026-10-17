# FreelanceFlow – Project Management Tool for Freelancers

A professional, full-stack SaaS application for freelancers to manage clients, projects, tasks, time tracking, invoices, and revenue — built as an internship-level B2B SaaS project.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Folder Structure](#-folder-structure)
5. [Database Models](#-database-models)
6. [API Endpoints](#-api-endpoints)
7. [Authentication Flow](#-authentication-flow)
8. [Time Tracking Logic](#-time-tracking-logic)
9. [Invoice Calculation Logic](#-invoice-calculation-logic)
10. [PDF Generation Logic](#-pdf-generation-logic)
11. [Data Isolation / Security](#-data-isolation--security)
12. [Free vs Pro Plan](#-free-vs-pro-plan)
13. [Sample Data](#-sample-data)
14. [Environment Variables](#-environment-variables)
15. [Local Setup](#-local-setup)
16. [Running the App](#-running-the-app)
17. [Deployment](#-deployment)
18. [Testing / Demo Flow](#-testing--demo-flow)
19. [Requirement Checklist](#-requirement-checklist)

---

## 🎯 Project Overview

FreelanceFlow is a multi-tenant SaaS application that helps freelancers:
- Manage client relationships (CRM)
- Organize projects with budgets and deadlines
- Track tasks using a kanban board
- Log time with a persistent live stopwatch
- Generate and download professional PDF invoices
- Analyze revenue and outstanding payments with charts

**Main Relationship:**
```
USER → CLIENT → PROJECT → TASKS → TIME LOGS → INVOICE
```

Every user's data is completely isolated. User A can never see User B's data.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based register/login/logout, password hashing |
| 👥 Client CRM | Full CRUD, search, client detail with stats |
| 📁 Projects | CRUD with budget tracking, status filters |
| ✓ Tasks | Kanban board + list view, due dates |
| ⏱ Time Tracking | Live stopwatch (persists across navigation), manual entry |
| 📄 Invoice Generator | 4-step wizard: client → date range → review logs → generate |
| 📥 PDF Download | Professional PDFKit-generated invoices |
| 📊 Financial Dashboard | Recharts: monthly revenue, outstanding pie, budget bar |
| 🏢 Multi-tenancy | Complete data isolation per user |
| 💳 Freemium Plan | Free (2 clients) vs Pro (unlimited) |
| 🎯 Sample Data | One-click demo data loader |

---

## 🛠 Tech Stack

### Frontend
- **React.js** + **Vite** (ES6+)
- **React Router** v6 (client-side routing)
- **Axios** (HTTP client with JWT interceptor)
- **Tailwind CSS** v3 (styling)
- **Recharts** (financial charts)
- **react-hot-toast** (notifications)

### Backend
- **Node.js** + **Express.js** (REST API)
- **MongoDB** + **Mongoose** (database + ODM)
- **JWT** (authentication)
- **bcryptjs** (password hashing)
- **PDFKit** (PDF invoice generation)
- **cors**, **dotenv**

---

## 📁 Folder Structure

```
FreelanceFlow/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   │   └── Sidebar.jsx          # Navigation sidebar
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── TimeTracking.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── InvoiceCreate.jsx
│   │   │   ├── InvoiceDetail.jsx
│   │   │   ├── Financials.jsx
│   │   │   └── Settings.jsx
│   │   ├── layouts/
│   │   │   └── Layout.jsx           # App shell with sidebar + header
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # JWT auth state
│   │   │   └── TimerContext.jsx     # Persistent timer state
│   │   ├── services/
│   │   │   └── api.js               # Axios instance with interceptors
│   │   ├── utils/
│   │   │   └── helpers.js           # Formatting utilities
│   │   ├── App.jsx                  # Router
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── timeLogController.js
│   │   ├── invoiceController.js
│   │   ├── dashboardController.js
│   │   └── sampleDataController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT verify middleware
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── TimeLog.js
│   │   └── Invoice.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── timeLogs.js
│   │   ├── invoices.js
│   │   ├── dashboard.js
│   │   ├── financials.js
│   │   └── sampleData.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env
│   ├── .env.example
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## 🗄 Database Models

### User
```js
{ name, email, password (hashed), plan: 'free'|'pro', createdAt }
```

### Client
```js
{ userId, name, email, phone, company, address, hourlyRate, createdAt }
```

### Project
```js
{ userId, clientId, name, description, status, budget, startDate, endDate, createdAt }
```

### Task
```js
{ userId, projectId, title, description, status, dueDate, createdAt }
```

### TimeLog
```js
{ userId, projectId, startTime, endTime, duration (minutes), description, billed, createdAt }
```

### Invoice
```js
{ userId, clientId, invoiceNumber, date, dueDate, dateRangeStart, dateRangeEnd, items[], subtotal, taxRate, tax, total, status, notes, timeLogIds[], createdAt }
```

---

## 🔌 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user, get JWT |
| GET | `/me` | Get current user |
| PUT | `/upgrade` | Upgrade to Pro |

### Clients — `/api/clients` (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List clients (with search) |
| POST | `/` | Create client (checks Free plan limit) |
| GET | `/:id` | Client detail + stats |
| PUT | `/:id` | Update client |
| DELETE | `/:id` | Delete client + related data |

### Projects — `/api/projects` (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List projects (filter by status/client) |
| POST | `/` | Create project |
| GET | `/:id` | Project detail + budget stats |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project + tasks + time logs |

### Tasks — `/api/tasks` (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List tasks (filter by project/status) |
| POST | `/` | Create task |
| PUT | `/:id` | Update task |
| DELETE | `/:id` | Delete task |

### Time Logs — `/api/time-logs` (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List time logs (filter by project/billed) |
| POST | `/` | Create time log (manual/timer) |
| GET | `/unbilled` | Get unbilled logs for invoice wizard |
| PUT | `/:id` | Update time log |
| DELETE | `/:id` | Delete time log |

### Invoices — `/api/invoices` (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List invoices |
| POST | `/` | Create invoice (marks logs as billed) |
| GET | `/:id` | Get invoice |
| GET | `/:id/pdf` | **Download PDF invoice** |
| PUT | `/:id` | Update invoice status |
| DELETE | `/:id` | Delete invoice (unmarks time logs) |

### Dashboard — `/api/dashboard` (protected)
| GET | `/` | Stats, upcoming tasks, recent activity, budget overview |

### Financials — `/api/financials` (protected)
| GET | `/` | Monthly revenue, outstanding by client, budget usage |

### Sample Data — `/api/sample-data` (protected)
| POST | `/` | Load demo data |
| DELETE | `/` | Clear all user data |

---

## 🔐 Authentication Flow

1. User registers with name/email/password
2. Password is hashed with bcrypt (10 salt rounds) before saving
3. On login, password is compared with bcrypt.compare()
4. JWT token is generated with `jsonwebtoken` (expires in 30 days)
5. Token is stored in localStorage on the frontend
6. Axios interceptor attaches `Authorization: Bearer <token>` to every request
7. `protect` middleware on backend verifies the token and sets `req.user`
8. On 401 response, axios interceptor clears localStorage and redirects to `/login`
9. Logout clears localStorage (token, user, timer state)

---

## ⏱ Time Tracking Logic

### Live Timer
1. User selects a project and clicks **Start**
2. `startTime = Date.now()` is saved to `localStorage`
3. A `setInterval` ticks every second and calculates: `elapsed = (Date.now() - startTime) / 1000`
4. **On navigation**: Timer context persists in React (no remount), localStorage holds startTime
5. **On refresh**: `useEffect` on mount reads `localStorage.timerStartTime` and restores the running state
6. User clicks **Stop**: `endTime = Date.now()`, `duration = Math.round((endTime - startTime) / 60000)` minutes
7. POST `/api/time-logs` with `{ projectId, startTime, endTime, duration, description }`

**Key localStorage keys:**
- `timerStartTime` – Unix timestamp of when timer started
- `timerProjectId` – Selected project ID
- `timerDescription` – Work description

### Manual Entry
User inputs: date, start hour/min, hours worked, minutes worked
`startTime = new Date(date + 'T' + startHour + ':' + startMin)`
`endTime = startTime + duration`

### Duration calculation
`duration (minutes) = (endTime - startTime) / 60000`
`hours = duration / 60`

---

## 🧾 Invoice Calculation Logic

**Step 1:** User selects client
**Step 2:** User picks date range and tax rate
**Step 3:** Backend fetches all unbilled time logs:
```
TimeLog.find({ userId, projectId: { $in: projectIds }, billed: false, startTime: { $gte: start, $lte: end } })
```
**Step 4:** User reviews and selects which logs to include
**Step 5:** Invoice is calculated:
```
hours = log.duration / 60
amount = hours × client.hourlyRate
subtotal = Σ amount for all selected logs
tax = subtotal × (taxRate / 100)
total = subtotal + tax
```
**Step 6:** Invoice is saved, and all included time logs are marked `billed: true`

This prevents double-billing: the same time logs cannot be invoiced twice.

---

## 📄 PDF Generation Logic

PDF is generated server-side using **PDFKit** in `invoiceController.js`:

1. `GET /api/invoices/:id/pdf` is called (protected)
2. Invoice + client + user data is fetched from MongoDB
3. A PDFKit `Document` is created and piped directly to `res` (streaming)
4. The PDF includes:
   - Dark header with FreelanceFlow branding
   - Invoice number, date, due date, status
   - From (freelancer) and Bill To (client) sections
   - Line items table (description, date, hours, rate, amount)
   - Totals section (subtotal, tax, grand total)
   - Notes and footer
5. Response headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename=invoice-INV-0001.pdf`
6. Frontend fetches with `Authorization` header and creates a Blob URL for download

---

## 🔒 Data Isolation / Security

**Every database query is scoped to the authenticated user's ID:**
```js
Client.find({ userId: req.user._id })         // List
Client.findOne({ _id: req.params.id, userId: req.user._id })  // Single item
```

**Resource ownership checks before any modification:**
```js
const client = await Client.findOne({ _id: id, userId: req.user._id });
if (!client) return res.status(404).json({ message: 'Client not found' });
```

This means:
- If User A tries to GET `/api/clients/USER_B_CLIENT_ID`, they get 404
- If User A tries to DELETE `/api/projects/USER_B_PROJECT_ID`, they get 404
- Changing an ID in the URL never reveals another user's data

**Security checklist:**
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 30-day expiry
- ✅ `protect` middleware on all private routes
- ✅ Every query uses `userId: req.user._id`
- ✅ Free plan limit enforced on **backend** (not just frontend)
- ✅ Secrets in `.env`, `.env` in `.gitignore`
- ✅ Invalid ObjectIds return 404 (via error handler)
- ✅ Unauthorized requests return 401/403

---

## 💳 Free vs Pro Plan

| Feature | Free | Pro |
|---------|------|-----|
| Clients | Max 2 | Unlimited |
| Projects | Unlimited | Unlimited |
| Tasks | Unlimited | Unlimited |
| Time tracking | ✓ | ✓ |
| Dashboard | Basic | Full |
| PDF invoices | ✓ | ✓ |
| Financial charts | ✓ | ✓ |
| Sample data | ✓ (needs Pro if ≥2 clients) | ✓ |

**Backend enforcement (clientController.js):**
```js
if (req.user.plan === 'free') {
  const count = await Client.countDocuments({ userId: req.user._id });
  if (count >= 2) {
    return res.status(403).json({
      message: 'You have reached the Free plan limit of 2 clients. Upgrade to Pro for unlimited clients.',
      limitReached: true,
    });
  }
}
```

Upgrade is available in `/settings`. For demo purposes, no payment gateway is required — the plan is stored in MongoDB and can be toggled via the settings page.

---

## 🎯 Sample Data

The **Load Sample Data** button on the dashboard creates:
- 3 clients (Acme Corp, TechStart Inc, Creative Studio)
- 5 projects with different statuses and budgets
- 14 tasks across projects
- 19 time log entries (mix of billed/unbilled)
- 3 invoices (1 Paid, 1 Outstanding, 1 Draft)

**Security:** All sample data is scoped to `userId: req.user._id` — it belongs only to the logged-in user.

**Duplicate prevention:** If the user already has ≥3 clients, loading sample data is blocked.

**Clear data:** Settings page → "Clear Data" button removes everything for that user.

---

## 🔧 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freelanceflow
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 💻 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Clone
git clone <repository-url>
cd FreelanceFlow

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server
cd server
cp .env.example .env
# Edit .env and set your MONGODB_URI and JWT_SECRET

# Client
cd ../client
cp .env.example .env
# Edit VITE_API_URL if your server runs on a different port
```

### 3. Start MongoDB
```bash
# If using local MongoDB:
mongod

# Or use MongoDB Atlas - just set the MONGODB_URI in server/.env
```

---

## 🚀 Running the App

### Backend (Terminal 1)
```bash
cd server
npm run dev        # Uses nodemon for hot reload
# or
npm start          # Production mode
```
Server runs on: `http://localhost:5000`

### Frontend (Terminal 2)
```bash
cd client
npm run dev        # Vite dev server
```
Frontend runs on: `http://localhost:5173`

### Health Check
```
GET http://localhost:5000/api/health
```

---

## 🌐 Deployment

### Backend (e.g., Railway, Render, Heroku)
1. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`
2. Deploy the `server/` directory
3. Start command: `node server.js`

### Frontend (e.g., Vercel, Netlify)
1. Set `VITE_API_URL` to your deployed backend URL
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy the `client/` directory

### MongoDB (Atlas)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add your backend server's IP to the whitelist
3. Get the connection string and set it as `MONGODB_URI`

---

## 🧪 Testing / Demo Flow

Follow these steps to demonstrate every feature:

1. **Register** a new account at `/register`
2. **Login** at `/login`
3. Open **Dashboard** — see empty state
4. Click **Load Sample Data** → confirm → data loads
5. View **Clients** page — see 3 clients
6. Click a client → **Client Detail** — see projects, invoices, stats
7. View **Projects** → click a project → **Project Detail** — see budget usage, tasks, time logs
8. View **Tasks** — kanban board with pending/in-progress/completed
9. Go to **Time Tracking** → select a project → click **▶ Start**
10. Navigate to Dashboard — timer still shows in sidebar and header
11. Return to Time Tracking — verify timer is still running (elapsed > 0)
12. Click **■ Stop & Save** — time log is created
13. Add a **Manual Time Entry** (e.g., "3 hours yesterday")
14. Go to **Financials** — charts update with real data
15. Go to **Invoices** → click **+ Create Invoice**
16. **Step 1**: Select a client
17. **Step 2**: Set date range (e.g., last 30 days), tax rate 18%
18. **Step 3**: Unbilled time logs are fetched — review and select
19. **Step 4**: Review totals → click **Generate Invoice**
20. Invoice is created → view **Invoice Detail**
21. Click **⬇ Download PDF** — professional PDF downloads
22. Check **Time Tracking** — selected logs now show "Billed ✓"
23. Try to create another invoice for same client + same date range → "No unbilled logs found" (prevents duplicate billing)
24. Go to **Settings** → see plan info → click **Upgrade to Pro**
25. **Free plan test**: Register a second account → add 2 clients → try adding a 3rd → see "Free plan limit" error message
26. **Data isolation test**: Login as user 1 and note a client ID → logout → login as user 2 → try accessing `/api/clients/<user1_client_id>` → get 404

---

## ✅ Requirement Checklist

| Requirement | Implementation | File/Route |
|------------|----------------|------------|
| React + Vite frontend | ✅ | `client/` |
| Node.js + Express backend | ✅ | `server/server.js` |
| MongoDB + Mongoose | ✅ | `server/models/` |
| JWT Authentication | ✅ | `server/middleware/auth.js` |
| bcrypt password hashing | ✅ | `server/models/User.js` |
| Protected routes | ✅ | `client/src/components/ProtectedRoute.jsx` |
| User model | ✅ | `server/models/User.js` |
| Client model | ✅ | `server/models/Client.js` |
| Project model | ✅ | `server/models/Project.js` |
| Task model | ✅ | `server/models/Task.js` |
| TimeLog model | ✅ | `server/models/TimeLog.js` |
| Invoice model | ✅ | `server/models/Invoice.js` |
| Client CRUD | ✅ | `GET/POST/PUT/DELETE /api/clients` |
| Project CRUD | ✅ | `GET/POST/PUT/DELETE /api/projects` |
| Task CRUD | ✅ | `GET/POST/PUT/DELETE /api/tasks` |
| Time tracking (timer) | ✅ | `client/src/context/TimerContext.jsx` |
| Timer persists across navigation | ✅ | localStorage `timerStartTime` |
| Timer persists on refresh | ✅ | `useEffect` reads localStorage on mount |
| Manual time entry | ✅ | `client/src/pages/TimeTracking.jsx` |
| Budget burn rate | ✅ | `server/controllers/projectController.js` |
| Invoice wizard | ✅ | `client/src/pages/InvoiceCreate.jsx` |
| Fetch unbilled logs | ✅ | `GET /api/time-logs/unbilled` |
| Mark logs as billed | ✅ | `server/controllers/invoiceController.js` |
| PDF download | ✅ | `GET /api/invoices/:id/pdf` (PDFKit) |
| Prevent duplicate billing | ✅ | `billed: true` + validation |
| Financial dashboard | ✅ | `client/src/pages/Financials.jsx` |
| Recharts revenue chart | ✅ | LineChart in Financials |
| Recharts outstanding chart | ✅ | PieChart in Financials |
| Recharts budget chart | ✅ | BarChart in Financials |
| Multi-tenancy / data isolation | ✅ | `userId: req.user._id` on all queries |
| Free plan limit (2 clients) | ✅ | Backend + frontend enforcement |
| Backend limit enforcement | ✅ | `server/controllers/clientController.js` |
| Sample data | ✅ | `POST /api/sample-data` |
| Sample data per user | ✅ | `userId` set to current user |
| Clear data | ✅ | `DELETE /api/sample-data` |
| Tailwind CSS | ✅ | `client/tailwind.config.js` |
| Responsive design | ✅ | Tailwind responsive classes |
| Sidebar navigation | ✅ | `client/src/components/Sidebar.jsx` |
| Toast notifications | ✅ | react-hot-toast throughout |
| Loading states | ✅ | Spinner components everywhere |
| Empty states | ✅ | Each page has empty state UI |
| Confirmation dialogs | ✅ | Delete confirmations throughout |
| Environment variables | ✅ | `.env` + `.env.example` |
| .env in .gitignore | ✅ | `.gitignore` |
| Error handling | ✅ | `server/middleware/errorHandler.js` |
| Controllers + routes | ✅ | Separate controller/route files |
| Settings page | ✅ | `client/src/pages/Settings.jsx` |
| Upgrade to Pro | ✅ | `PUT /api/auth/upgrade` |

---

## 📞 Support

Built with ❤️ by FreelanceFlow Team.
For issues, check the server logs and ensure MongoDB is running.
