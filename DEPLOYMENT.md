# Cloudflare Pages Deployment Guide

## Quick Start Deployment

### Option 1: GitHub + Cloudflare Pages (Recommended)

This is the easiest method with automatic deployments on every push.

#### Step 1: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - FishTournament Pro Next.js"

# Create main branch
git branch -M main

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/fishtournament-pro.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Connect to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Project name**: `fishtournament-pro`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
6. Click **Save and Deploy**

Your site will be live at: `https://fishtournament-pro.pages.dev`

### Option 2: Direct Upload via Wrangler CLI

For manual deployments without GitHub.

#### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

#### Step 2: Login to Cloudflare

```bash
wrangler login
```

#### Step 3: Build the Project

```bash
npm run pages:build
```

#### Step 4: Deploy

```bash
wrangler pages deploy .vercel/output/static --project-name=fishtournament-pro
```

## Custom Domain Setup

### Step 1: Add Domain in Cloudflare

1. Go to your project in Cloudflare Pages
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `www.fishtournament.pro`)
5. Follow the DNS configuration instructions

### Step 2: Update DNS Records

In your Cloudflare DNS settings, add:

```
Type: CNAME
Name: www
Content: fishtournament-pro.pages.dev
Proxy status: Proxied (orange cloud)
```

For apex domain (e.g., `fishtournament.pro`):

```
Type: CNAME
Name: @
Content: fishtournament-pro.pages.dev
Proxy status: Proxied (orange cloud)
```

## Environment Variables

### Setting Up Environment Variables in Cloudflare Pages

1. Go to your project settings
2. Navigate to **Settings** → **Environment variables**
3. Add the following variables:

#### Production Environment

```
NEXT_PUBLIC_ADMIN_EMAIL = admin@fishtournament.com
NEXT_PUBLIC_ADMIN_PASSWORD = your_secure_password
NEXT_PUBLIC_APP_FEE = 6.50
NEXT_PUBLIC_APP_NAME = FishTournament Pro
```

## Cloudflare KV Storage Setup

For persistent data storage across deployments:

### Step 1: Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "TOURNAMENT_DATA"

# Create preview KV namespace (for preview deployments)
wrangler kv:namespace create "TOURNAMENT_DATA" --preview
```

### Step 2: Update wrangler.toml

Create `wrangler.toml` in project root:

```toml
name = "fishtournament-pro"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TOURNAMENT_DATA"
id = "your_namespace_id_here"
preview_id = "your_preview_namespace_id_here"
```

### Step 3: Update Storage Implementation

Modify `src/lib/storage.ts` to use KV binding:

```typescript
// For Cloudflare KV
declare global {
  const TOURNAMENT_DATA: KVNamespace;
}

export const storage = {
  async get(key: string) {
    if (typeof TOURNAMENT_DATA === 'undefined') {
      // Fallback to localStorage in development
      return /* localStorage implementation */;
    }
    const value = await TOURNAMENT_DATA.get(key);
    return value ? { key, value } : null;
  },
  // ... other methods
};
```

## Performance Optimization

### Enable Caching

In Cloudflare Dashboard:

1. Go to **Caching** → **Configuration**
2. Set **Browser Cache TTL**: 4 hours
3. Enable **Always Online**

### Cache Rules

Create a Page Rule for static assets:

```
URL: *fishtournament.pro/*.{jpg,jpeg,png,gif,svg,css,js}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

### Image Optimization

Use Cloudflare Images or enable Image Resizing:

1. Go to **Speed** → **Optimization**
2. Enable **Auto Minify**: HTML, CSS, JavaScript
3. Enable **Brotli**

## Security Configuration

### SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**

### Security Headers

Add custom headers in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ];
}
```

## Monitoring & Analytics

### Enable Web Analytics

1. Go to **Analytics** → **Web Analytics**
2. Click **Add site**
3. Follow setup instructions
4. Add the analytics script to your site

### Set Up Alerts

1. Go to **Notifications**
2. Create alerts for:
   - Deployment failures
   - Error rate increases
   - Traffic spikes

## Continuous Deployment

### GitHub Actions Integration

Your site automatically deploys when you push to the main branch.

For custom deployment workflows, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@2
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy .vercel/output/static --project-name=fishtournament-pro
```

## Troubleshooting

### Build Failures

Check build logs in Cloudflare Dashboard:
1. Go to **Deployments**
2. Click on failed deployment
3. Review build logs

Common issues:
- Missing environment variables
- Incorrect build command
- Output directory mismatch

### 404 Errors

Ensure `next.config.js` has:
```javascript
output: 'export',
trailingSlash: true,
```

### Data Not Persisting

- Check KV namespace binding
- Verify environment variables
- Review storage implementation

## Rollback

To rollback to a previous version:

1. Go to **Deployments**
2. Find the previous successful deployment
3. Click **...** → **Rollback to this deployment**

## Support Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Post-Deployment Checklist

- [ ] Custom domain configured
- [ ] SSL/TLS enabled
- [ ] Environment variables set
- [ ] Analytics tracking enabled
- [ ] Performance optimization configured
- [ ] Security headers implemented
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team access configured

🎉 Your FishTournament Pro app is now live on Cloudflare Pages!
