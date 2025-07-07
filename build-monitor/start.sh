#!/bin/bash
# Build Monitor Startup Script

echo "Android Build Fix Automation System"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in project root directory"
    echo "Please run from the root of your React Native project"
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    echo "Install with: pkg install python (on Termux)"
    exit 1
fi

# Install required Python packages if needed
echo "Checking Python dependencies..."
pip3 install requests 2>/dev/null || true

# Get GitHub repository info
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL =~ github.com[:/]([^/]+)/([^.]+) ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
else
    echo "Error: Could not determine GitHub repository"
    echo "Please specify manually:"
    read -p "Owner: " OWNER
    read -p "Repository: " REPO
fi

# Get current branch
BRANCH=$(git branch --show-current)

echo ""
echo "Configuration:"
echo "  Repository: $OWNER/$REPO"
echo "  Branch: $BRANCH"
echo ""

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Warning: GITHUB_TOKEN not set"
    echo "You may hit API rate limits without authentication"
    echo ""
    echo "To set a token:"
    echo "  export GITHUB_TOKEN=your_github_personal_access_token"
    echo ""
    read -p "Continue without token? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create necessary directories
mkdir -p build-monitor/logs
mkdir -p build-monitor/analysis

# Start the orchestrator
echo ""
echo "Starting build monitor..."
echo "Press Ctrl+C to stop"
echo ""

cd build-monitor
python3 orchestrator.py "$OWNER" "$REPO" "$BRANCH"