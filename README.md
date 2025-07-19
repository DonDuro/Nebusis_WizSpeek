# WizSpeek® - Static Demo Version

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)]()
[![Render](https://img.shields.io/badge/Render-00979D?style=for-the-badge&logo=render&logoColor=white)]()

> Static demo version of WizSpeek® - Secure AI-Powered Messaging Platform, optimized for Render static site deployment.

## 🎯 About This Version

This is a **static frontend-only version** of WizSpeek® designed for deployment on Render as a static site. It showcases the complete UI/UX without requiring a backend server.

### Features Included
- ✅ Complete responsive UI design
- ✅ All messaging interface components
- ✅ ISO compliance dashboard (demo mode)
- ✅ Progressive Web App capabilities
- ✅ WizSpeek® branding and themes
- ✅ Enhanced 13-option menu
- ✅ Mobile-first design

### Demo Limitations
- ❌ No real-time messaging (demo data only)
- ❌ No user authentication (demo mode)
- ❌ No database persistence
- ❌ No file uploads

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

### Build for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Deploy to Render

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: WizSpeek® static demo"
git remote add origin https://github.com/yourusername/wizspeak-static.git
git push -u origin main
```

### Step 2: Connect to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure deployment:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: `18`

### Step 3: Deploy
Render will automatically build and deploy your site. You'll get a URL like:
`https://wizspeak-static.onrender.com`

## 🎨 Customization

### Environment Variables (Optional)
```bash
# For external API integration
VITE_API_URL=https://your-api.com
VITE_APP_NAME=WizSpeek®
```

### Theme Customization
Edit `src/index.css` to customize colors and styling.

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── chat-area.tsx    # Main chat interface
│   └── enhanced-menu.tsx # 13-option menu
├── pages/               # Page components
│   ├── chat.tsx         # Chat page
│   ├── login.tsx        # Login demo
│   └── dashboard.tsx    # Admin dashboard
├── lib/                 # Utilities
│   ├── utils.ts         # Helper functions
│   └── mock-data.ts     # Demo data
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## 🔧 Technical Details

### Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Zustand** for state management
- **Framer Motion** for animations

### Build Output
- Optimized static files in `dist/`
- Code splitting for better performance
- Compressed assets for fast loading

## 🏢 About WizSpeek®

WizSpeek® is developed by **Nebusis®** - Building the future of secure communications.

This static demo showcases the professional-grade UI/UX design and features of the full WizSpeek® platform.

---

**For the full-featured version with backend, real-time messaging, and AWS deployment, see the main WizSpeek® repository.**