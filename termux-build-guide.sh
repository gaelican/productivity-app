#!/bin/bash
# Termux-Specific Build Guide for React Native

echo "📱 Termux Build Guide for React Native"
echo "======================================"
echo ""
echo "Since you're working from Termux, here's the recommended approach:"
echo ""

# Step 1: Push to GitHub
echo "📤 Step 1: Push your code to GitHub"
echo "-----------------------------------"
echo "git add -A"
echo "git commit -m 'Setup GitHub Actions for Android builds'"
echo "git push origin $(git branch --show-current)"
echo ""

# Step 2: GitHub Actions
echo "🤖 Step 2: GitHub Actions will build automatically"
echo "-------------------------------------------------"
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo "2. You'll see the build running"
echo "3. Wait ~10-15 minutes for completion"
echo ""

# Step 3: Download APK
echo "📥 Step 3: Download APK to your phone"
echo "------------------------------------"
echo "Option A: Direct download from GitHub (easiest):"
echo "1. Open Chrome/Browser on your phone"
echo "2. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo "3. Click on the latest successful build"
echo "4. Download the APK artifact"
echo ""
echo "Option B: Using Termux (if you have gh CLI):"
echo "pkg install gh"
echo "gh auth login"
echo "gh run list"
echo "gh run download [RUN_ID]"
echo ""

# Step 4: Install APK
echo "📲 Step 4: Install the APK"
echo "--------------------------"
echo "1. Open your file manager"
echo "2. Navigate to Downloads"
echo "3. Click on app-debug.apk"
echo "4. Allow installation from unknown sources if prompted"
echo ""

# Alternative: Termux + Cloud VM
echo "☁️  Alternative: Use a Cloud VM"
echo "------------------------------"
echo "If you need more control:"
echo "1. Use Google Cloud Shell (free): https://shell.cloud.google.com"
echo "2. Clone your repo there"
echo "3. Build the APK"
echo "4. Download using gcloud CLI"
echo ""

# Quick Commands
echo "⚡ Quick Commands for Termux"
echo "---------------------------"
echo "# Install GitHub CLI"
echo "pkg install gh"
echo ""
echo "# Setup GitHub CLI"
echo "gh auth login"
echo ""
echo "# Watch build status"
echo "gh run watch"
echo ""
echo "# Download latest artifact"
echo "gh run download -n app-debug"
echo ""

# Current Status
echo "📊 Your Current Status"
echo "--------------------"
if [ -d ".github/workflows" ]; then
    echo "✅ GitHub Actions workflow created"
else
    echo "❌ GitHub Actions workflow not found"
fi

if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    REMOTE=$(git remote get-url origin 2>/dev/null)
    if [ -n "$REMOTE" ]; then
        echo "✅ Remote origin: $REMOTE"
    else
        echo "⚠️  No remote origin set"
        echo "   Run: git remote add origin https://github.com/USERNAME/REPO.git"
    fi
else
    echo "❌ Not a git repository"
fi
echo ""

# Tips
echo "💡 Termux-Specific Tips"
echo "----------------------"
echo "1. Use 'pkg install openssh' for better git performance"
echo "2. Set up SSH keys for GitHub to avoid password prompts"
echo "3. Use 'termux-setup-storage' to access Downloads easily"
echo "4. Install 'termux-api' package for notifications"
echo ""
echo "📱 Build Notifications"
echo "--------------------"
echo "Get notified when builds complete:"
echo "1. Install Termux:API app from F-Droid"
echo "2. pkg install termux-api"
echo "3. Use this script to check build status:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# Save as check-build.sh
while true; do
    STATUS=$(gh run list --limit 1 --json status -q '.[0].status')
    if [ "$STATUS" == "completed" ]; then
        termux-notification --title "Build Complete" --content "Your APK is ready!"
        break
    fi
    sleep 60
done
SCRIPT
echo ""