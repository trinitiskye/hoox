# FishTournament Pro - Next.js TypeScript

Professional Tournament Management Platform built with Next.js, TypeScript, and Tailwind CSS, optimized for Cloudflare Pages deployment.

## 🚀 Features

- **Tournament Management**: Create, manage, and track fishing tournaments
- **User Roles**: Admin, Tournament Directors, Anglers, and Sponsors
- **Catch Submissions**: Photo uploads and real-time leaderboards
- **Registration System**: Tournament registration with fee management
- **Sponsor Management**: Banner promotions with scheduling
- **Search Functionality**: Advanced search across tournaments, anglers, and directors
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Cloudflare Ready**: Optimized for Cloudflare Pages deployment

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Git
- Cloudflare account (for deployment)
- GitHub account (for repository management)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/fishtournament-pro.git
cd fishtournament-pro
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
fishtournament-nextjs/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── layout/          # Layout components (Header, Footer)
│   │   ├── tournament/      # Tournament components
│   │   ├── user/            # User management components
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utility functions
│   │   ├── storage.ts       # Storage utilities
│   │   ├── utils.ts         # Helper functions
│   │   └── sampleData.ts    # Sample data
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── public/                  # Static assets
├── .gitignore
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🌐 Cloudflare Pages Deployment

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fishtournament-pro.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Select **Connect to Git**
   - Choose your repository
   - Configure build settings:
     - **Framework preset**: Next.js
     - **Build command**: `npm run pages:build`
     - **Build output directory**: `.vercel/output/static`
   - Click **Save and Deploy**

### Method 2: Direct Upload via Wrangler

1. **Install Wrangler**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Build and Deploy**:
   ```bash
   npm run pages:build
   npm run pages:deploy
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Admin Credentials
NEXT_PUBLIC_ADMIN_EMAIL=admin@fishtournament.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password

# App Configuration
NEXT_PUBLIC_APP_FEE=6.50
NEXT_PUBLIC_APP_NAME=FishTournament Pro
```

### Cloudflare KV Setup (Optional)

For production data persistence, set up Cloudflare KV:

1. Create a KV namespace in Cloudflare Dashboard
2. Add to `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "TOURNAMENT_DATA"
   id = "your_namespace_id"
   ```

3. Update `src/lib/storage.ts` to use KV instead of localStorage

## 📝 Git Workflow

### Initial Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fishtournament-pro.git
git push -u origin main
```

### Regular Development

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request on GitHub
# After merge, pull latest main
git checkout main
git pull origin main
```

## 🎨 Customization

### Tailwind CSS Theme

Edit `tailwind.config.js` to customize colors, fonts, and other design tokens:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Components

All components are in `src/components/`. Key components include:

- `Header.tsx` - Navigation and branding
- `Footer.tsx` - Footer with links
- `TournamentCard.tsx` - Tournament display card
- `SearchDatabase.tsx` - Search functionality
- `TournamentWinners.tsx` - Winner showcase

## 🧪 Testing

```bash
# Run TypeScript type checking
npm run type-check

# Run linting
npm run lint

# Run build to check for errors
npm run build
```

## 📦 Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run start
```

## 🔒 Security Notes

- Never commit `.env.local` or sensitive credentials
- Use environment variables for all sensitive data
- Implement proper authentication for production
- Enable HTTPS on Cloudflare Pages
- Configure CORS and CSP headers

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [Lucide React Icons](https://lucide.dev)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review Cloudflare Pages logs for deployment issues

## 🎯 Next Steps

After deployment:

1. **Configure Custom Domain**: Add your domain in Cloudflare Pages settings
2. **Set Up Analytics**: Enable Cloudflare Web Analytics
3. **Configure Caching**: Optimize with Cloudflare cache rules
4. **Add Database**: Integrate Cloudflare D1 or KV for data persistence
5. **Implement Auth**: Add authentication with Cloudflare Access or Auth.js
6. **Enable Email**: Set up email notifications with Cloudflare Email Workers

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
