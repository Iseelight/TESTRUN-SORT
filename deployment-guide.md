# RecruitAI Deployment Guide

This guide covers deploying the frontend and backend as separate repositories while maintaining proper integration.

## 🏗 Architecture Overview

```
Frontend (React/Vite) ←→ Backend (FastAPI/PostgreSQL)
     ↓                        ↓
  Static Hosting          Server Hosting
  (Netlify/Vercel)       (Railway/Render)
```

## 📦 Repository Structure

### Frontend Repository
```
recruitai-frontend/
├── src/
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
└── README.md
```

### Backend Repository
```
recruitai-backend/
├── app/
├── alembic/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Deployment Steps

### 1. Backend Deployment

#### Option A: Railway
1. Connect your backend repository to Railway
2. Set environment variables:
   ```env
   DATABASE_URL=postgresql://...  # Railway provides this
   SECRET_KEY=your-production-secret
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.com"]
   ```
3. Railway will automatically deploy on git push

#### Option B: Render
1. Connect your backend repository to Render
2. Configure build command: `pip install -r requirements.txt`
3. Configure start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables in Render dashboard

#### Option C: Heroku
1. Create Heroku app: `heroku create your-backend-app`
2. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:hobby-dev`
3. Set environment variables: `heroku config:set SECRET_KEY=your-secret`
4. Deploy: `git push heroku main`

### 2. Frontend Deployment

#### Option A: Netlify
1. Connect your frontend repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables:
   ```env
   VITE_API_BASE_URL=https://your-backend-app.railway.app
   ```
4. Enable SPA redirects in `netlify.toml`:
   ```toml
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

#### Option B: Vercel
1. Connect your frontend repository to Vercel
2. Framework preset: Vite
3. Set environment variables:
   ```env
   VITE_API_BASE_URL=https://your-backend-app.railway.app
   ```
4. Vercel handles SPA routing automatically

## 🔧 Configuration

### CORS Setup
Ensure your backend allows requests from your frontend domain:

```python
# backend/app/core/config.py
BACKEND_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "https://your-frontend-domain.netlify.app",
    "https://your-frontend-domain.vercel.app"
]
```

### API Base URL
Update your frontend to point to the deployed backend:

```env
# frontend/.env
VITE_API_BASE_URL=https://your-backend-app.railway.app
```

## 🔒 Security Considerations

### Environment Variables
- **Never commit** `.env` files to git
- Use **strong secrets** in production
- **Rotate keys** regularly

### HTTPS
- Always use HTTPS in production
- Update CORS origins to use `https://`
- Ensure secure cookie settings

### Database Security
- Use managed database services
- Enable SSL connections
- Regular backups

## 📊 Monitoring

### Backend Monitoring
- Use application monitoring (Sentry, DataDog)
- Set up health check endpoints
- Monitor database performance

### Frontend Monitoring
- Use error tracking (Sentry)
- Monitor Core Web Vitals
- Set up analytics

## 🔄 CI/CD Pipeline

### GitHub Actions Example

#### Frontend CI/CD
```yaml
# .github/workflows/frontend.yml
name: Frontend Deploy
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
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Backend CI/CD
```yaml
# .github/workflows/backend.yml
name: Backend Deploy
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
        uses: railway-app/railway-action@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🧪 Testing Integration

### Local Development
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Test API integration at `http://localhost:5173`

### Staging Environment
1. Deploy backend to staging
2. Deploy frontend with staging API URL
3. Run E2E tests

## 📈 Scaling Considerations

### Backend Scaling
- Use horizontal scaling (multiple instances)
- Implement database connection pooling
- Add Redis for caching
- Use CDN for static assets

### Frontend Scaling
- CDN distribution (automatic with Netlify/Vercel)
- Image optimization
- Code splitting
- Lazy loading

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
- Check backend CORS configuration
- Verify frontend domain in CORS origins
- Ensure HTTPS/HTTP consistency

#### Authentication Issues
- Verify JWT secret consistency
- Check token expiration settings
- Validate API endpoints

#### Database Connection
- Verify DATABASE_URL format
- Check database server status
- Validate connection pooling settings

### Debug Commands

```bash
# Check backend health
curl https://your-backend-app.railway.app/health

# Test API endpoint
curl -X POST https://your-backend-app.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check frontend build
npm run build && npm run preview
```

## 📞 Support

For deployment issues:
1. Check service status pages
2. Review deployment logs
3. Verify environment variables
4. Test API connectivity
5. Check CORS configuration

This guide ensures your frontend and backend can be deployed independently while maintaining seamless integration.