# Complete RecruitAI Deployment Setup Guide

## 🎯 Overview

This guide will walk you through creating two separate repositories and deploying them independently while maintaining full integration.

## 📁 Step 1: Create Two Separate Git Repositories

### Frontend Repository Setup

1. **Create a new directory for frontend**
   ```bash
   mkdir recruitai-frontend
   cd recruitai-frontend
   git init
   ```

2. **Copy frontend files from current project**
   ```bash
   # Copy these files/folders to your frontend repository:
   cp -r src/ recruitai-frontend/
   cp -r public/ recruitai-frontend/
   cp index.html recruitai-frontend/
   cp vite.config.ts recruitai-frontend/
   cp tailwind.config.js recruitai-frontend/
   cp postcss.config.js recruitai-frontend/
   cp eslint.config.js recruitai-frontend/
   cp tsconfig*.json recruitai-frontend/
   
   # Rename the frontend-specific files
   cp frontend-package.json recruitai-frontend/package.json
   cp frontend-README.md recruitai-frontend/README.md
   cp .env.frontend recruitai-frontend/.env.example
   cp netlify.toml recruitai-frontend/
   cp vercel.json recruitai-frontend/
   ```

3. **Create frontend .gitignore**
   ```bash
   cat > recruitai-frontend/.gitignore << 'EOF'
   # Dependencies
   node_modules/
   
   # Build outputs
   dist/
   build/
   
   # Environment variables
   .env
   .env.local
   .env.production
   
   # IDE
   .vscode/
   .idea/
   
   # OS
   .DS_Store
   Thumbs.db
   
   # Logs
   *.log
   npm-debug.log*
   
   # Runtime data
   pids
   *.pid
   *.seed
   
   # Coverage directory used by tools like istanbul
   coverage/
   
   # Temporary folders
   tmp/
   temp/
   EOF
   ```

4. **Initialize frontend repository**
   ```bash
   cd recruitai-frontend
   git add .
   git commit -m "Initial frontend setup"
   
   # Create GitHub repository and push
   # Replace with your GitHub username
   git remote add origin https://github.com/yourusername/recruitai-frontend.git
   git branch -M main
   git push -u origin main
   ```

### Backend Repository Setup

1. **Create a new directory for backend**
   ```bash
   mkdir recruitai-backend
   cd recruitai-backend
   git init
   ```

2. **Copy backend files from current project**
   ```bash
   # Copy these files/folders to your backend repository:
   cp -r backend/app/ recruitai-backend/
   cp -r backend/alembic/ recruitai-backend/
   cp -r backend/scripts/ recruitai-backend/
   cp backend/alembic.ini recruitai-backend/
   cp backend/Dockerfile recruitai-backend/
   cp backend/docker-compose.yml recruitai-backend/
   
   # Rename the backend-specific files
   cp backend-requirements.txt recruitai-backend/requirements.txt
   cp backend-README.md recruitai-backend/README.md
   cp .env.backend recruitai-backend/.env.example
   cp Procfile recruitai-backend/
   cp railway.toml recruitai-backend/
   ```

3. **Create backend .gitignore**
   ```bash
   cat > recruitai-backend/.gitignore << 'EOF'
   # Python
   __pycache__/
   *.py[cod]
   *$py.class
   *.so
   .Python
   build/
   develop-eggs/
   dist/
   downloads/
   eggs/
   .eggs/
   lib/
   lib64/
   parts/
   sdist/
   var/
   wheels/
   
   # Virtual environments
   venv/
   env/
   ENV/
   
   # Environment variables
   .env
   .env.local
   .env.production
   
   # Database
   *.db
   *.sqlite3
   
   # IDE
   .vscode/
   .idea/
   
   # OS
   .DS_Store
   Thumbs.db
   
   # Logs
   *.log
   
   # Uploads
   uploads/
   
   # Alembic
   alembic/versions/*.py
   !alembic/versions/__init__.py
   EOF
   ```

4. **Initialize backend repository**
   ```bash
   cd recruitai-backend
   git add .
   git commit -m "Initial backend setup"
   
   # Create GitHub repository and push
   # Replace with your GitHub username
   git remote add origin https://github.com/yourusername/recruitai-backend.git
   git branch -M main
   git push -u origin main
   ```

## 🚀 Step 2: Deploy Backend First

### Option A: Railway Deployment (Recommended)

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy backend to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # In your backend repository directory
   cd recruitai-backend
   railway init
   railway up
   ```

3. **Configure environment variables in Railway**
   - Go to your Railway dashboard
   - Click on your project
   - Go to Variables tab
   - Add these variables:
   ```
   SECRET_KEY=your-super-secret-key-change-this-in-production
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.netlify.app"]
   DATABASE_URL=(Railway will provide this automatically)
   ```

4. **Get your backend URL**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Save this URL for frontend configuration

### Option B: Render Deployment

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account

2. **Create new Web Service**
   - Click "New +" → "Web Service"
   - Connect your backend repository
   - Configure:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Python Version**: 3.11

3. **Add environment variables**
   ```
   SECRET_KEY=your-super-secret-key-change-this-in-production
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.netlify.app"]
   ```

4. **Add PostgreSQL database**
   - Click "New +" → "PostgreSQL"
   - Copy the database URL to your web service environment variables

## 🌐 Step 3: Deploy Frontend

### Option A: Netlify Deployment (Recommended)

1. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub account

2. **Deploy frontend to Netlify**
   - Click "Add new site" → "Import an existing project"
   - Choose your frontend repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

3. **Configure environment variables**
   - Go to Site settings → Environment variables
   - Add:
   ```
   VITE_API_BASE_URL=https://your-backend-app.railway.app
   ```

4. **Get your frontend URL**
   - Netlify will provide a URL like: `https://amazing-app-name.netlify.app`
   - You can customize this in Site settings

### Option B: Vercel Deployment

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Deploy frontend to Vercel**
   - Click "New Project"
   - Import your frontend repository
   - Vercel will auto-detect Vite settings

3. **Configure environment variables**
   - Go to Project settings → Environment Variables
   - Add:
   ```
   VITE_API_BASE_URL=https://your-backend-app.railway.app
   ```

## 🔧 Step 4: Update CORS Configuration

1. **Update backend CORS settings**
   - Go to your backend deployment (Railway/Render)
   - Update environment variables:
   ```
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.netlify.app", "https://your-frontend-domain.vercel.app"]
   ```

2. **Redeploy backend**
   - Railway: Automatic on git push
   - Render: Automatic on git push

## 🧪 Step 5: Test the Integration

### Test Authentication
1. **Visit your frontend URL**
2. **Try to sign up as a recruiter**
3. **Try to sign up as a candidate**
4. **Test login functionality**

### Test API Integration
1. **Open browser developer tools**
2. **Check Network tab for API calls**
3. **Verify no CORS errors**
4. **Test job creation (recruiter)**
5. **Test job application (candidate)**

### Debug Common Issues

#### CORS Errors
```bash
# Check if backend is accessible
curl https://your-backend-app.railway.app/health

# Test CORS
curl -H "Origin: https://your-frontend-domain.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-backend-app.railway.app/api/v1/auth/login
```

#### Authentication Issues
```bash
# Test login endpoint
curl -X POST https://your-backend-app.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Step 6: Monitor and Maintain

### Set up monitoring
1. **Backend monitoring**
   - Railway/Render provide basic monitoring
   - Add Sentry for error tracking
   - Monitor database performance

2. **Frontend monitoring**
   - Netlify/Vercel provide analytics
   - Add Google Analytics
   - Monitor Core Web Vitals

### Regular maintenance
1. **Update dependencies**
   ```bash
   # Frontend
   npm update
   
   # Backend
   pip install -r requirements.txt --upgrade
   ```

2. **Monitor logs**
   - Check deployment logs regularly
   - Set up alerts for errors
   - Monitor API response times

## 🔄 Step 7: Set up CI/CD (Optional)

### GitHub Actions for automatic deployment

1. **Frontend CI/CD** (`.github/workflows/frontend.yml`)
   ```yaml
   name: Deploy Frontend
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run build
           env:
             VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
         - name: Deploy to Netlify
           uses: netlify/actions/cli@master
           with:
             args: deploy --prod --dir=dist
           env:
             NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
             NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
   ```

2. **Backend CI/CD** (`.github/workflows/backend.yml`)
   ```yaml
   name: Deploy Backend
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-python@v4
           with:
             python-version: 3.11
         - run: pip install -r requirements.txt
         - run: pytest
         - name: Deploy to Railway
           run: |
             npm install -g @railway/cli
             railway login --token ${{ secrets.RAILWAY_TOKEN }}
             railway up
   ```

## ✅ Checklist

- [ ] Created separate frontend repository
- [ ] Created separate backend repository
- [ ] Deployed backend to Railway/Render
- [ ] Deployed frontend to Netlify/Vercel
- [ ] Updated CORS configuration
- [ ] Tested authentication flow
- [ ] Tested API integration
- [ ] Set up monitoring
- [ ] Configured CI/CD (optional)

## 🆘 Troubleshooting

### Common Issues and Solutions

1. **"Network Error" in frontend**
   - Check if backend URL is correct in environment variables
   - Verify backend is running and accessible
   - Check CORS configuration

2. **Authentication not working**
   - Verify JWT secret is set in backend
   - Check token expiration settings
   - Ensure API endpoints are correct

3. **Database connection issues**
   - Verify DATABASE_URL format
   - Check if database service is running
   - Ensure database migrations are applied

4. **Build failures**
   - Check Node.js/Python versions
   - Verify all dependencies are listed
   - Check for syntax errors

### Getting Help

- Check deployment logs in your hosting platform
- Use browser developer tools to debug frontend issues
- Test API endpoints directly with curl
- Check GitHub Issues for common problems

## 🎉 Success!

Once you complete these steps, you'll have:
- ✅ Two separate repositories
- ✅ Independent deployments
- ✅ Full integration between frontend and backend
- ✅ Production-ready applications

Your RecruitAI platform is now live and ready for users!