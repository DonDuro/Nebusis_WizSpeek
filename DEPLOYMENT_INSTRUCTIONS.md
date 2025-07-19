# WizSpeek® Static Deployment Instructions

## 📋 Render Deployment Steps

### 1. Upload to GitHub
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "WizSpeek® static demo for Render deployment"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/wizspeak-static.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Render
1. **Login to Render**: Go to https://dashboard.render.com
2. **New Static Site**: Click "New +" → "Static Site"
3. **Connect Repository**: Link your GitHub repository
4. **Configure Settings**:
   - **Name**: `wizspeak-static`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Yes

### 3. Build Settings
- **Environment**: Node.js
- **Node Version**: 18
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### 4. Optional Environment Variables
If you want to customize the app:
```
VITE_APP_NAME=WizSpeek®
VITE_DEMO_MODE=true
```

## 🎯 What You Get

### ✅ Working Features
- Complete WizSpeek® UI interface
- Responsive design (desktop + mobile)
- All messaging components
- ISO compliance dashboard (demo)
- Enhanced 13-option menu
- Progressive Web App features
- Professional Nebusis® branding

### 📱 Demo Experience
- Interactive messaging interface
- Sample conversations with demo data
- Compliance reporting simulation
- All visual features and animations
- Mobile-optimized layout

## 🔧 Customization Options

### Branding
- Edit `src/index.css` for colors
- Modify `public/manifest.json` for PWA settings
- Update logos in `public/` folder

### Content
- Edit `src/lib/mock-data.ts` for demo content
- Modify messaging in components

## ⚡ Performance

The static build includes:
- Code splitting for faster loading
- Optimized assets
- Compressed files
- Fast CDN delivery via Render

## 🌐 Access Your Site

After deployment, your site will be available at:
`https://wizspeak-static.onrender.com`

## 📞 Support

For the full-featured WizSpeek® with backend, database, and real-time messaging, contact Nebusis® for enterprise deployment options.