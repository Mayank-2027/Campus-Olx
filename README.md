# CampusOLX

> 🎓 The trusted marketplace built exclusively for JEC students

## 🚀 Quick Start

### 1. Configure Environment Variables

**Server** (`server/.env`) — Create this file locally and add your credentials:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Start Development

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
Campus-Olx/
├── server/                 # Node.js + Express + MongoDB
│   ├── models/             # Mongoose schemas (7 models)
│   ├── routes/             # API routes
│   ├── middleware/         # Auth, upload, passport
│   ├── socket/             # Socket.io real-time
│   └── server.js
└── client/                 # React + Vite + Tailwind
    └── src/
        ├── pages/          # 25+ pages
        ├── components/     # Reusable UI components
        ├── context/        # AuthContext + Socket.io
        └── api/            # Axios API calls
```

## 🔐 Add Google OAuth

1. Go to https://console.cloud.google.com
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Set Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Secret to `server/.env`

## 🎓 Branch Codes

| Code | Branch |
|------|--------|
| IT | Information Technology |
| CS | Computer Science |
| EE | Electrical Engineering |
| EC | Electronics & Communication |
| ME | Mechanical Engineering |
| MT | Mechatronics |
| CE | Civil Engineering |
| AI | Artificial Intelligence |
| IP | Information & Planning |

## 📧 College Domain


