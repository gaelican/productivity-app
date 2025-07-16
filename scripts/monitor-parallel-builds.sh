#!/bin/bash

# Parallel Build Monitoring Script
# Monitors the progress of all solution tests in real-time

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo_error "GitHub CLI (gh) is required but not installed"
    echo_info "Install with: pkg install gh"
    exit 1
fi

# Get the latest workflow run
echo_info "Finding parallel solution test workflow..."

WORKFLOW_ID=$(gh run list --repo gaelican/productivity-app --workflow "parallel-solution-test.yml" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")

if [ -z "$WORKFLOW_ID" ]; then
    echo_warning "No parallel solution test runs found. Starting a new one..."
    
    # Trigger the workflow
    gh workflow run parallel-solution-test.yml \
        --repo gaelican/productivity-app \
        --ref downgrade-to-rn-073 \
        -f solutions_to_test=all
    
    echo_info "Waiting for workflow to start..."
    sleep 10
    
    # Get the new workflow ID
    WORKFLOW_ID=$(gh run list --repo gaelican/productivity-app --workflow "parallel-solution-test.yml" --limit 1 --json databaseId --jq '.[0].databaseId')
fi

echo_success "Monitoring workflow run: $WORKFLOW_ID"
echo_info "View in browser: https://github.com/gaelican/productivity-app/actions/runs/$WORKFLOW_ID"
echo ""

# Function to get job status
get_job_status() {
    local solution=$1
    local job_name="Test Solution $solution"
    
    # Get all jobs for this workflow
    local status=$(gh run view $WORKFLOW_ID --repo gaelican/productivity-app --json jobs --jq ".jobs[] | select(.name == \"$job_name\") | .conclusion // .status" 2>/dev/null || echo "pending")
    
    echo "$status"
}

# Monitor loop
echo "Monitoring solution builds..."
echo "================================"
echo ""

declare -A solution_names
solution_names[a]="Gradle Version Fix"
solution_names[b]="AsyncStorage Stub"
solution_names[c]="Resolution Strategy"
solution_names[d]="Clean Template"
solution_names[e]="Manual Resolution"
solution_names[f]="Docker Build"
solution_names[g]="Remove WatermelonDB"
solution_names[h]="Custom Plugin"
solution_names[i]="Namespace Migration"
solution_names[j]="Hybrid Approach"
solution_names[k]="Fix Autolinking"

# Status tracking
declare -A last_status

while true; do
    clear
    echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│         PARALLEL SOLUTION TEST MONITOR                      │${NC}"
    echo -e "${CYAN}├────────────────────────────────────────────────────────────┤${NC}"
    
    all_done=true
    success_count=0
    failure_count=0
    
    for solution in a b c d e f g h i j k; do
        status=$(get_job_status $solution)
        
        # Status emoji
        case "$status" in
            "success")
                emoji="✅"
                ((success_count++))
                ;;
            "failure")
                emoji="❌"
                ((failure_count++))
                ;;
            "in_progress")
                emoji="⏳"
                all_done=false
                ;;
            "queued"|"pending")
                emoji="⏸️"
                all_done=false
                ;;
            "cancelled")
                emoji="🚫"
                ;;
            "skipped")
                emoji="⏭️"
                ;;
            *)
                emoji="❓"
                all_done=false
                ;;
        esac
        
        # Print status line
        printf "${CYAN}│${NC} Solution %-1s ${emoji} %-20s %-15s ${CYAN}│${NC}\n" \
            "${solution^^}" "${solution_names[$solution]}" "$status"
        
        # Check if status changed
        if [ "${last_status[$solution]}" != "$status" ] && [ -n "${last_status[$solution]}" ]; then
            if [ "$status" == "success" ]; then
                echo_success "Solution ${solution^^} completed successfully!"
            elif [ "$status" == "failure" ]; then
                echo_error "Solution ${solution^^} failed"
            fi
        fi
        
        last_status[$solution]=$status
    done
    
    echo -e "${CYAN}├────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC} Summary: ${GREEN}$success_count succeeded${NC}, ${RED}$failure_count failed${NC}                      ${CYAN}│${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
    
    if $all_done; then
        echo ""
        echo_success "All tests completed!"
        echo ""
        
        # Show successful solutions
        if [ $success_count -gt 0 ]; then
            echo_success "Working solutions:"
            for solution in a b c d e f g h i j k; do
                if [ "${last_status[$solution]}" == "success" ]; then
                    echo "  ✅ Solution ${solution^^}: ${solution_names[$solution]}"
                fi
            done
        fi
        
        echo ""
        echo_info "Download artifacts:"
        echo "  gh run download $WORKFLOW_ID --repo gaelican/productivity-app"
        
        break
    fi
    
    # Refresh every 5 seconds
    sleep 5
done

# Final actions
echo ""
echo_info "Generating detailed report..."

# Create report
cat > parallel-test-report.md << EOF
# Parallel Solution Test Report

**Workflow Run**: $WORKFLOW_ID
**Date**: $(date)
**Repository**: gaelican/productivity-app

## Results Summary

| Solution | Name | Status |
|----------|------|--------|
EOF

for solution in a b c d e f g h i j; do
    status="${last_status[$solution]}"
    emoji="❓"
    [ "$status" == "success" ] && emoji="✅"
    [ "$status" == "failure" ] && emoji="❌"
    
    echo "| ${solution^^} | ${solution_names[$solution]} | $emoji $status |" >> parallel-test-report.md
done

cat >> parallel-test-report.md << EOF

## Next Steps

EOF

if [ $success_count -gt 0 ]; then
    echo "### Working Solutions Found!" >> parallel-test-report.md
    echo "" >> parallel-test-report.md
    echo "The following solutions successfully built the APK:" >> parallel-test-report.md
    echo "" >> parallel-test-report.md
    
    for solution in a b c d e f g h i j k; do
        if [ "${last_status[$solution]}" == "success" ]; then
            echo "- **Solution ${solution^^}**: ${solution_names[$solution]}" >> parallel-test-report.md
            echo "  - Download APK: \`gh run download $WORKFLOW_ID --repo gaelican/productivity-app -n solution-$solution-apk\`" >> parallel-test-report.md
        fi
    done
else
    echo "No solutions succeeded. Review the logs for each solution to identify issues." >> parallel-test-report.md
fi

echo_success "Report saved to: parallel-test-report.md"