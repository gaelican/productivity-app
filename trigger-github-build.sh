#!/bin/bash

# GitHub Actions Build Trigger Script
# This script helps trigger and monitor GitHub Actions builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub repository info
GITHUB_REPO="gaelican/productivity-app"
WORKFLOW_NAME="android-build.yml"

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check git status
check_git_status() {
    echo_info "Checking git status..."
    
    if ! git remote -v | grep -q "github.com"; then
        echo_error "No GitHub remote found!"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo_warning "You have uncommitted changes:"
        git status --short
        echo ""
        read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add -A
            git commit -m "$commit_msg"
        else
            echo_info "Proceeding without committing changes..."
        fi
    fi
}

# Function to push changes
push_changes() {
    local branch=$(git branch --show-current)
    echo_info "Pushing to branch: $branch"
    
    if git push origin "$branch"; then
        echo_success "Changes pushed successfully!"
        return 0
    else
        echo_error "Failed to push changes"
        return 1
    fi
}

# Function to trigger workflow manually
trigger_workflow() {
    local branch=$(git branch --show-current)
    local build_type="${1:-debug}"
    local verbose="${2:-true}"
    
    echo_info "Triggering workflow manually..."
    echo_info "Branch: $branch"
    echo_info "Build type: $build_type"
    echo_info "Verbose logs: $verbose"
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        echo_error "GitHub CLI (gh) is not installed!"
        echo_info "Install it with: pkg install gh"
        echo_info "Then authenticate with: gh auth login"
        return 1
    fi
    
    # Trigger the workflow
    if gh workflow run "$WORKFLOW_NAME" \
        --repo "$GITHUB_REPO" \
        --ref "$branch" \
        -f build_type="$build_type" \
        -f verbose_logs="$verbose"; then
        echo_success "Workflow triggered successfully!"
        return 0
    else
        echo_error "Failed to trigger workflow"
        return 1
    fi
}

# Function to watch workflow status
watch_workflow() {
    echo_info "Checking workflow status..."
    
    if ! command -v gh &> /dev/null; then
        echo_warning "GitHub CLI not available, cannot watch status"
        echo_info "View status at: https://github.com/$GITHUB_REPO/actions"
        return
    fi
    
    # Get the latest workflow run
    local run_id=$(gh run list \
        --repo "$GITHUB_REPO" \
        --workflow "$WORKFLOW_NAME" \
        --limit 1 \
        --json databaseId \
        --jq '.[0].databaseId')
    
    if [ -z "$run_id" ]; then
        echo_error "No workflow runs found"
        return
    fi
    
    echo_info "Watching workflow run #$run_id"
    echo_info "View in browser: https://github.com/$GITHUB_REPO/actions/runs/$run_id"
    
    # Watch the workflow
    gh run watch "$run_id" --repo "$GITHUB_REPO"
}

# Function to download artifacts
download_artifacts() {
    local run_id="${1:-}"
    
    if ! command -v gh &> /dev/null; then
        echo_error "GitHub CLI not available"
        return 1
    fi
    
    if [ -z "$run_id" ]; then
        # Get the latest successful run
        run_id=$(gh run list \
            --repo "$GITHUB_REPO" \
            --workflow "$WORKFLOW_NAME" \
            --status success \
            --limit 1 \
            --json databaseId \
            --jq '.[0].databaseId')
    fi
    
    if [ -z "$run_id" ]; then
        echo_error "No successful runs found"
        return 1
    fi
    
    echo_info "Downloading artifacts from run #$run_id"
    
    # Create artifacts directory
    mkdir -p github-artifacts
    cd github-artifacts
    
    # Download all artifacts
    if gh run download "$run_id" --repo "$GITHUB_REPO"; then
        echo_success "Artifacts downloaded to github-artifacts/"
        ls -la
    else
        echo_error "Failed to download artifacts"
    fi
    
    cd ..
}

# Main menu
show_menu() {
    echo ""
    echo "=== GitHub Actions Build Tool ==="
    echo "Repository: $GITHUB_REPO"
    echo ""
    echo "1) Push changes and trigger build"
    echo "2) Trigger build manually (without push)"
    echo "3) Watch latest workflow run"
    echo "4) Download artifacts from latest build"
    echo "5) View build logs in browser"
    echo "6) Exit"
    echo ""
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Select option (1-6): " choice
        
        case $choice in
            1)
                check_git_status
                if push_changes; then
                    echo_info "Build will start automatically"
                    sleep 3
                    watch_workflow
                fi
                ;;
            2)
                read -p "Build type (debug/release) [debug]: " build_type
                build_type=${build_type:-debug}
                read -p "Verbose logs (true/false) [true]: " verbose
                verbose=${verbose:-true}
                
                if trigger_workflow "$build_type" "$verbose"; then
                    sleep 3
                    watch_workflow
                fi
                ;;
            3)
                watch_workflow
                ;;
            4)
                download_artifacts
                ;;
            5)
                echo_info "Opening browser..."
                echo "URL: https://github.com/$GITHUB_REPO/actions"
                # Try to open in browser
                if command -v termux-open-url &> /dev/null; then
                    termux-open-url "https://github.com/$GITHUB_REPO/actions"
                else
                    echo_info "Copy this URL to your browser:"
                    echo "https://github.com/$GITHUB_REPO/actions"
                fi
                ;;
            6)
                echo_info "Exiting..."
                exit 0
                ;;
            *)
                echo_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "android" ]; then
    echo_error "This script must be run from the project root directory"
    exit 1
fi

# Run main menu
main