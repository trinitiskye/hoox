# Quick Start Guide - FishTournament Pro

Get your FishTournament Pro application running in 5 minutes!

## Prerequisites

✅ Node.js 18 or higher  
✅ npm or yarn  
✅ Git  
✅ GitHub account  
✅ Cloudflare account  

## Step-by-Step Setup

### 1. Initial Setup (2 minutes)

```bash
# Navigate to project directory
cd fishtournament-nextjs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 - You should see the application running!

### 2. GitHub Setup (1 minute)

```bash
# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit"

# Create main branch
git branch -M main

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/fishtournament-pro.git

# Push to GitHub
git push -u origin main
```

### 3. Cloudflare Deployment (2 minutes)

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select your GitHub repository
5. Configure:
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output: `.vercel/output/static`
6. Click **Save and Deploy**

**Done!** Your site is live at `https://YOUR-PROJECT.pages.dev`

## What's Included

### Features
- ✅ Tournament management system
- ✅ User authentication (Admin, Director, Angler, Sponsor)
- ✅ Catch submission with photo uploads
- ✅ Real-time leaderboards
- ✅ Registration system
- ✅ Sponsor management
- ✅ Search functionality
- ✅ Responsive design

### Tech Stack
- ⚡ Next.js 14 (App Router)
- 🔷 TypeScript
- 🎨 Tailwind CSS
- 📦 Cloudflare Pages
- 🎯 Lucide React Icons

## Directory Structure

```
fishtournament-nextjs/
├── src/
│   ├── app/              # Pages and layouts
│   ├── components/       # React components (to be created)
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript definitions
├── public/              # Static assets
└── Configuration files
```

## Key Files

- `src/app/page.tsx` - Main landing page
- `src/types/index.ts` - TypeScript types
- `src/lib/storage.ts` - Data storage utilities
- `src/lib/utils.ts` - Helper functions
- `src/lib/sampleData.ts` - Sample tournament data

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Build for Cloudflare
npm run pages:build

# Deploy to Cloudflare
npm run pages:deploy
```

## Next Steps

### Immediate Tasks

1. **Customize Branding**
   - Update logo and colors in `tailwind.config.js`
   - Modify site title in `src/app/layout.tsx`

2. **Add Authentication**
   - Implement login/register functionality
   - Add protected routes
   - Set up admin credentials

3. **Build Components**
   - Create tournament components
   - Build user management UI
   - Develop submission system

4. **Set Up Database**
   - Configure Cloudflare KV or D1
   - Update storage implementation
   - Migrate from localStorage

### Recommended Order

1. ✅ Get basic site running (Done!)
2. 🔄 Build core components
3. 🔄 Implement authentication
4. 🔄 Add database integration
5. 🔄 Configure custom domain
6. 🔄 Set up monitoring

## Common Tasks

### Add a New Component

```bash
# Create component file
touch src/components/MyComponent.tsx
```

```typescript
export default function MyComponent() {
  return (
    <div className="p-4">
      My Component
    </div>
  );
}
```

### Add a New Page

```bash
# Create page directory
mkdir src/app/tournaments
touch src/app/tournaments/page.tsx
```

### Update Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_ADMIN_PASSWORD=secure_password
NEXT_PUBLIC_APP_FEE=6.50
```

## Customization Guide

### Change Color Scheme

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#YOUR_COLOR', // Your brand color
      },
    },
  },
}
```

### Add New Features

1. Define TypeScript types in `src/types/index.ts`
2. Create components in `src/components/`
3. Add pages in `src/app/`
4. Update storage if needed

### Modify Sample Data

Edit `src/lib/sampleData.ts` to change:
- Initial tournaments
- Sample users
- Test submissions
- Registration data

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors

```bash
# Run type check
npx tsc --noEmit
```

## Getting Help

- 📚 [Full README](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 💬 Create an issue on GitHub
- 📖 [Next.js Docs](https://nextjs.org/docs)
- ☁️ [Cloudflare Docs](https://developers.cloudflare.com/pages)

## Resources

- **Next.js**: https://nextjs.org
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **Cloudflare Pages**: https://pages.cloudflare.com
- **Lucide Icons**: https://lucide.dev

---

## Success Checklist

After following this guide, you should have:

- ✅ Local development server running
- ✅ Code pushed to GitHub
- ✅ Site deployed to Cloudflare Pages
- ✅ Live URL accessible
- ✅ Ready to build features!

**Congratulations!** 🎉 Your FishTournament Pro application is up and running!

Need help? Check the full [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information.
