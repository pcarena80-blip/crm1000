# 🚂 Railway Deployment Guide

## Deploy Your Chat App Backend to Railway

### 1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

### 2. **Login to Railway**
```bash
railway login
```

### 3. **Initialize Railway Project**
```bash
railway init
```

### 4. **Deploy to Railway**
```bash
railway up
```

### 5. **Set Environment Variables**
In Railway dashboard, set:
- `PORT` (Railway sets this automatically)
- `NODE_ENV=production`
- `OPENAI_API_KEY` (optional)
- `GOOGLE_GENERATIVE_AI_API_KEY` (optional)

### 6. **Get Your Backend URL**
Railway will give you a URL like:
```
https://your-app-name.railway.app
```

### 7. **Update Frontend**
Update your frontend to use the Railway backend URL instead of localhost:3001

## 🎯 **What This Deploys:**
- ✅ Node.js backend server
- ✅ Socket.IO real-time chat
- ✅ Express API endpoints
- ✅ User authentication
- ✅ Chat functionality

## 🌐 **Result:**
Your chat app will be fully functional with:
- Frontend: Netlify
- Backend: Railway
- Real-time messaging working! 🚀
