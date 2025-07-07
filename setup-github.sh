#!/bin/bash
# GitHub Setup Script for Productivity App

echo "🚀 Setting up GitHub for your Productivity App"
echo "============================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    pkg install gh -y
fi

echo "📝 Step 1: Create GitHub Repository"
echo "----------------------------------"
echo ""
echo "Option A: Using GitHub CLI (Recommended)"
echo "1. Run: gh auth login"
echo "2. Choose GitHub.com"
echo "3. Choose HTTPS"
echo "4. Authenticate with web browser"
echo "5. Then run:"
echo ""
echo "gh repo create productivity-app --public --source=. --remote=origin --push"
echo ""
echo "Option B: Manual Creation"
echo "1. Go to https://github.com/new"
echo "2. Repository name: productivity-app"
echo "3. Make it public (for free GitHub Actions)"
echo "4. DON'T initialize with README"
echo "5. Create repository"
echo "6. Then run these commands:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/productivity-app.git"
echo ""

# Current status
echo "📊 Current Status:"
echo "-----------------"
echo "Branch: $(git branch --show-current)"
echo "Uncommitted files:"
git status --porcelain

echo ""
echo "📋 Next Steps:"
echo "-------------"
echo "1. Add and commit GitHub Actions workflow:"
echo "   git add .github/ fix-claude-flicker.sh termux-build-guide.sh"
echo "   git commit -m 'Add GitHub Actions workflow for Android builds'"
echo ""
echo "2. Push to GitHub:"
echo "   git push -u origin $(git branch --show-current)"
echo ""
echo "3. Check build status:"
echo "   gh run list"
echo "   # OR visit: https://github.com/YOUR_USERNAME/productivity-app/actions"
echo ""
echo "4. Download APK when ready:"
echo "   gh run download -n app-debug"
echo ""