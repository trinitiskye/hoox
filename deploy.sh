#!/bin/bash

# FishTournament Pro - Quick Deployment Script
# This script helps you quickly deploy to Cloudflare Pages

echo "🐟 FishTournament Pro - Deployment Script"
echo "=========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found"
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "Select deployment option:"
echo "1) Build for Cloudflare Pages"
echo "2) Build and Deploy to Cloudflare"
echo "3) Run local development server"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🔨 Building for Cloudflare Pages..."
        npm run pages:build
        echo "✅ Build complete!"
        echo "📁 Output directory: .vercel/output/static"
        ;;
    2)
        echo "🚀 Building and deploying to Cloudflare..."
        npm run pages:build
        echo ""
        echo "Deploying..."
        npm run pages:deploy
        echo "✅ Deployment complete!"
        ;;
    3)
        echo "🔥 Starting development server..."
        npm run dev
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Done! 🎉"
