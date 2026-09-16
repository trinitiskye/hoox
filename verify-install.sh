#!/bin/bash

# FishTournament Pro - Installation Verification Script
# Run this after extracting the project to verify everything is set up correctly

echo "🐟 FishTournament Pro - Installation Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
    
    # Extract major version number
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js version is 18 or higher"
    else
        echo -e "${RED}✗${NC} Node.js version must be 18 or higher"
        echo "  Please upgrade Node.js: https://nodejs.org"
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    echo "  Please install Node.js: https://nodejs.org"
fi
echo ""

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
fi
echo ""

# Check Git
echo "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓${NC} Git installed: $GIT_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Git not found (optional but recommended)"
fi
echo ""

# Check project files
echo "Checking project files..."
REQUIRED_FILES=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.js"
    "src/app/page.tsx"
    "src/app/layout.tsx"
    "src/types/index.ts"
    "README.md"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (MISSING)"
        MISSING_FILES+=("$file")
    fi
done
echo ""

# Check component files
echo "Checking components..."
COMPONENT_FILES=(
    "src/components/layout/Header.tsx"
    "src/components/layout/Footer.tsx"
    "src/components/layout/HeroCarousel.tsx"
    "src/components/tournament/TournamentCard.tsx"
    "src/components/tournament/TournamentWinners.tsx"
    "src/components/search/SearchDatabase.tsx"
)

for file in "${COMPONENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (MISSING)"
    fi
done
echo ""

# Summary
echo "=================================================="
echo "Summary:"
echo ""

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required files present${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install"
    echo "2. Run: npm run dev"
    echo "3. Open: http://localhost:3000"
    echo ""
    echo "For deployment:"
    echo "- See DEPLOYMENT.md for Cloudflare Pages setup"
    echo "- See QUICKSTART.md for quick setup guide"
else
    echo -e "${RED}✗ Missing ${#MISSING_FILES[@]} required file(s)${NC}"
    echo "Please ensure all files were extracted correctly"
fi
echo ""
echo "Documentation:"
echo "- README.md - Complete documentation"
echo "- QUICKSTART.md - 5-minute setup guide"
echo "- DEPLOYMENT.md - Deployment instructions"
echo "- PROJECT_SUMMARY.md - Project overview"
echo ""
echo "For help, see README.md or visit:"
echo "https://nextjs.org/docs"
echo "https://developers.cloudflare.com/pages"
