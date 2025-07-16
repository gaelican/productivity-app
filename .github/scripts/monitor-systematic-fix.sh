#!/bin/bash
# Monitor script for systematic build fix workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Solution descriptions
declare -A SOLUTION_NAMES=(
    [a]="Version Alignment"
    [b]="Stub/Mock AsyncStorage"
    [c]="Clean Gradle Config"
    [d]="Template Reset"
    [e]="Force Resolutions"
    [f]="Docker Build"
    [g]="Remove Conflicting Deps"
    [h]="Custom Gradle Plugin"
    [i]="Patch Packages"
    [j]="Hybrid Approach"
    [k]="EAS-Specific Fixes"
)

echo -e "${BLUE}=== Systematic Build Fix Monitor ===${NC}"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "${CYAN}Repository: $REPO${NC}"

# Check for existing runs
echo -e "\n${YELLOW}Checking for existing workflow runs...${NC}"
EXISTING_RUNS=$(gh run list --workflow "systematic-build-fix.yml" --limit 5 --json databaseId,status,createdAt,headBranch -q '.[] | "\(.databaseId) - \(.status) - \(.createdAt) - \(.headBranch)"' 2>/dev/null || echo "")

if [ -n "$EXISTING_RUNS" ]; then
    echo -e "${GREEN}Recent runs:${NC}"
    echo "$EXISTING_RUNS" | while IFS= read -r run; do
        echo "  $run"
    done
    echo ""
    read -p "Start a new workflow run? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        # Get the most recent run
        RUN_ID=$(echo "$EXISTING_RUNS" | head -1 | cut -d' ' -f1)
        echo -e "${CYAN}Monitoring existing run: $RUN_ID${NC}"
    else
        START_NEW=true
    fi
else
    START_NEW=true
fi

# Start new workflow if needed
if [ "${START_NEW:-false}" = true ]; then
    echo -e "${YELLOW}Starting new workflow...${NC}"
    gh workflow run systematic-build-fix.yml -f solutions_to_test=all -f verbose_logging=true
    sleep 5
    
    # Get the new run ID
    RUN_ID=$(gh run list --workflow "systematic-build-fix.yml" --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$RUN_ID" ]; then
        echo -e "${RED}Failed to start workflow${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Started workflow run: $RUN_ID${NC}"
fi

echo -e "\n${BLUE}View in browser:${NC} https://github.com/${REPO}/actions/runs/${RUN_ID}"
echo ""

# Monitor loop
LAST_UPDATE=""
COMPLETED=false

while [ "$COMPLETED" = false ]; do
    # Clear screen for clean display
    clear
    
    echo -e "${BLUE}┌────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│        SYSTEMATIC BUILD FIX PROGRESS               │${NC}"
    echo -e "${BLUE}├────────────────────────────────────────────────────┤${NC}"
    
    # Get overall workflow status
    WORKFLOW_STATUS=$(gh run view $RUN_ID --json status -q '.status' 2>/dev/null || echo "unknown")
    WORKFLOW_CONCLUSION=$(gh run view $RUN_ID --json conclusion -q '.conclusion // "pending"' 2>/dev/null || echo "pending")
    
    echo -e "${BLUE}│${NC} Workflow: Run #${RUN_ID}"
    echo -e "${BLUE}│${NC} Status: ${YELLOW}${WORKFLOW_STATUS}${NC}"
    echo -e "${BLUE}├────────────────────────────────────────────────────┤${NC}"
    
    # Track successful solutions
    SUCCESSFUL_SOLUTIONS=""
    FAILED_SOLUTIONS=""
    
    # Get status for each solution
    for solution in {a..k}; do
        JOB_INFO=$(gh run view $RUN_ID --json jobs -q ".jobs[] | select(.name | contains(\"Solution ${solution}\")) | {status: .status, conclusion: .conclusion}" 2>/dev/null || echo '{"status":"pending","conclusion":null}')
        
        STATUS=$(echo "$JOB_INFO" | jq -r '.status // "pending"')
        CONCLUSION=$(echo "$JOB_INFO" | jq -r '.conclusion // "pending"')
        
        # Determine display status
        if [ "$CONCLUSION" = "success" ]; then
            symbol="✅"
            color=$GREEN
            SUCCESSFUL_SOLUTIONS="${SUCCESSFUL_SOLUTIONS} ${solution^^}"
        elif [ "$CONCLUSION" = "failure" ]; then
            symbol="❌"
            color=$RED
            FAILED_SOLUTIONS="${FAILED_SOLUTIONS} ${solution^^}"
        elif [ "$STATUS" = "in_progress" ]; then
            symbol="⏳"
            color=$YELLOW
        elif [ "$STATUS" = "queued" ]; then
            symbol="⏸️"
            color=$CYAN
        else
            symbol="⏸️"
            color=$NC
        fi
        
        printf "${BLUE}│${NC} Solution ${solution^^}: ${color}${symbol}${NC} %-26s ${BLUE}│${NC}\n" "${SOLUTION_NAMES[$solution]}"
    done
    
    echo -e "${BLUE}└────────────────────────────────────────────────────┘${NC}"
    
    # Display summary
    if [ -n "$SUCCESSFUL_SOLUTIONS" ]; then
        echo -e "\n${GREEN}✅ Successful:${NC}${SUCCESSFUL_SOLUTIONS}"
    fi
    
    if [ -n "$FAILED_SOLUTIONS" ]; then
        echo -e "${RED}❌ Failed:${NC}${FAILED_SOLUTIONS}"
    fi
    
    # Check if workflow is complete
    if [ "$WORKFLOW_STATUS" = "completed" ]; then
        COMPLETED=true
        echo -e "\n${GREEN}Workflow completed!${NC}"
        
        # Show final summary
        echo -e "\n${BLUE}=== FINAL RESULTS ===${NC}"
        
        if [ -n "$SUCCESSFUL_SOLUTIONS" ]; then
            echo -e "${GREEN}The following solutions built successfully:${NC}"
            for sol in $SUCCESSFUL_SOLUTIONS; do
                echo -e "  ✅ Solution $sol - ${SOLUTION_NAMES[${sol,,}]}"
            done
            
            echo -e "\n${YELLOW}Next steps:${NC}"
            echo "1. View detailed results at: https://github.com/${REPO}/actions/runs/${RUN_ID}"
            echo "2. Download APKs from successful builds"
            echo "3. Apply the most appropriate solution to your codebase"
        else
            echo -e "${RED}All solutions failed to build.${NC}"
            echo -e "\n${YELLOW}Debugging steps:${NC}"
            echo "1. View logs at: https://github.com/${REPO}/actions/runs/${RUN_ID}"
            echo "2. Check common error patterns across all solutions"
            echo "3. Consider manual debugging with verbose logging"
        fi
        
        # Generate report
        echo -e "\n${YELLOW}Generating detailed report...${NC}"
        bash .github/scripts/generate-fix-report.sh $RUN_ID 2>/dev/null || echo "Report generation skipped"
        
        break
    fi
    
    # Show last update time
    CURRENT_TIME=$(date +"%H:%M:%S")
    echo -e "\n${CYAN}Last updated: $CURRENT_TIME${NC}"
    echo -e "${CYAN}Press Ctrl+C to stop monitoring${NC}"
    
    # Wait before next update
    sleep 10
done

echo -e "\n${BLUE}=== Monitoring complete ===${NC}"