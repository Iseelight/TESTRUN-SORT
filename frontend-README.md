# RecruitAI Frontend

A modern React-based frontend for the RecruitAI platform with TypeScript, Tailwind CSS, and comprehensive authentication.

## 🚀 Features

- **Modern React 18** with TypeScript
- **Tailwind CSS** for styling with dark mode support
- **Authentication** with JWT and Google OAuth integration
- **Responsive Design** optimized for all devices
- **Role-based Access** for recruiters and candidates
- **AI Interview Interface** with voice recording capabilities
- **Real-time Updates** and interactive dashboards

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── candidate/      # Candidate-specific components
│   ├── recruiter/      # Recruiter-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── contexts/           # React Context providers
├── pages/              # Main page components
├── lib/                # API client and utilities
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

## 🛠 Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <frontend-repository-url>
   cd recruitai-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   
   # Google OAuth (optional)
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   
   # App Configuration
   VITE_APP_NAME=RecruitAI
   VITE_APP_VERSION=1.0.0
   ```

   For production deployment, update `VITE_API_BASE_URL` to your backend API URL:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com
   ```

### Development

1. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Preview production build**
   ```bash
   npm run preview
   ```

## 🔧 Configuration

### API Integration

The frontend communicates with the backend API through the configuration in `src/lib/api.ts`. The base URL is set via the `VITE_API_BASE_URL` environment variable.

### Authentication Flow

1. **JWT Authentication**: Uses access and refresh tokens
2. **Google OAuth**: Mock implementation ready for real integration
3. **Role-based Access**: Separate interfaces for recruiters and candidates
4. **Persistent Sessions**: Tokens stored in localStorage with automatic refresh

### Deployment

#### Netlify Deployment

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Set `VITE_API_BASE_URL` to your backend URL

#### Vercel Deployment

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**: Configure `VITE_API_BASE_URL`

#### Custom Server Deployment

1. Build the project: `npm run build`
2. Serve the `dist` folder using any static file server
3. Ensure proper routing for SPA (Single Page Application)

### CORS Configuration

Ensure your backend allows requests from your frontend domain. Update the backend's CORS settings to include your frontend URL.

## 🎯 Key Features

### For Recruiters
- **Job Management**: Create, edit, and manage job postings
- **Candidate Assessment**: AI-powered scoring and filtering
- **Analytics Dashboard**: Comprehensive hiring metrics
- **Social Sharing**: Generate shareable job links

### For Candidates
- **Job Discovery**: Browse and apply for positions
- **AI Interviews**: Intelligent conversational assessments
- **Voice Recording**: Audio responses with speech-to-text
- **Real-time Results**: Immediate feedback and scoring

### Universal Features
- **Dark Mode**: Complete theme support
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Real-time Updates**: Live data synchronization

## 🔒 Security

- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Sanitized user inputs
- **Secure Authentication**: JWT with automatic token refresh
- **Environment Variables**: Sensitive data stored securely

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📈 Performance

- **Code Splitting**: Optimized bundle loading
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with lazy loading
- **Caching**: Efficient API response caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.