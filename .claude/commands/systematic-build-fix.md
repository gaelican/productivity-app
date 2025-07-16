# Systematic Build Fix Command

A comprehensive approach to solving complex build errors using parallel testing and systematic analysis. This combines the debugging and parallel solution testing into a single, powerful workflow.

## Overview
This command implements an 8-stage process that systematically analyzes build failures, creates multiple solutions, tests them in parallel, and documents the working fix.

## Complete Workflow

### Stage 1: Deep Build Failure Analysis
/grind Analyze all build failures comprehensively:
- Collect and categorize all error messages from recent builds
- Identify patterns: which errors appear together, timing, frequency
- Check for environmental factors: OS, tool versions, dependencies
- Review recent changes that correlate with failure onset
- Create error taxonomy with root causes and symptoms
- Generate failure analysis report with visual timeline

### Stage 2: Research Known Issues and Context
/grind Research framework, dependency, and tool-specific issues:
- Search official issue trackers for all involved technologies
- Review release notes for recent versions of all dependencies
- Check migration guides and breaking changes
- Search community forums, Stack Overflow, and Discord/Slack
- Analyze similar projects that solved comparable issues
- Document all findings with links and relevance scores

### Stage 3: Dependency and Configuration Analysis
/grind Perform comprehensive dependency and build configuration analysis:
- Map entire dependency tree including transitive dependencies
- Identify version conflicts and duplicate packages
- Check for native module compatibility issues
- Analyze build tool configurations (Gradle, Metro, etc.)
- Review platform-specific requirements and settings
- Create conflict matrix showing incompatible combinations

### Stage 4: Solution Generation
/grind Generate comprehensive solution set based on analysis:
```bash
# Create at least 10 different approaches:
Solution A: Version Management
- Downgrade/upgrade specific dependencies
- Pin exact versions to avoid conflicts
- Use resolution strategies in package managers

Solution B: Stub/Mock Approach  
- Create stub modules for problematic dependencies
- Mock functionality to bypass errors
- Implement minimal interfaces

Solution C: Build Configuration
- Modify Gradle/build tool settings
- Adjust compilation flags and options
- Custom build scripts and tasks

Solution D: Clean Slate
- Start from working template
- Gradually add dependencies back
- Identify breaking point

Solution E: Dependency Resolution
- Force specific versions via resolutions
- Exclude problematic transitive deps
- Custom dependency management

Solution F: Environment Isolation
- Docker/containerized builds
- Specific tool version combinations
- Isolated build environments

Solution G: Removal Strategy
- Remove conflicting dependencies
- Find alternatives or implement locally
- Simplify dependency tree

Solution H: Custom Tooling
- Build plugins and extensions
- Custom scripts and automation
- Patch existing tools

Solution I: Code Modifications
- Patch dependent packages
- Fix incompatible code
- Namespace/package adjustments

Solution J: Hybrid Approach
- Combine multiple strategies
- Layer fixes for robustness
- Comprehensive solution

Solution K: Autolinking/Integration Fixes
- Fix module discovery and linking
- Custom integration scripts
- Manual configuration
```

### Stage 5: Parallel Solution Implementation
/grind Implement all solutions with proper isolation:
```bash
# For each solution, create implementation script:
#!/bin/bash
# scripts/apply-solution-{x}.sh

echo "=== Applying Solution X: {Name} ==="
echo "Strategy: {detailed description}"
echo ""

# Pre-checks
if [ ! -f "package.json" ]; then
    echo "Error: Not in project root"
    exit 1
fi

# Implementation steps
echo "Step 1: {description}"
# ... implementation ...

echo "Step 2: {description}"
# ... implementation ...

# Verification
echo "Verifying solution..."
# ... verification steps ...

echo "Solution X applied successfully!"
```

Create GitHub Actions workflow for parallel testing:
```yaml
name: Systematic Build Fix - Parallel Testing
on:
  workflow_dispatch:
    inputs:
      solutions_to_test:
        description: 'Solutions to test (comma-separated or "all")'
        required: true
        default: 'all'

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Set up solution matrix
      id: set-matrix
      run: |
        if [ "${{ github.event.inputs.solutions_to_test }}" == "all" ]; then
          echo 'matrix={"solution":["a","b","c","d","e","f","g","h","i","j","k"]}' >> $GITHUB_OUTPUT
        else
          solutions=$(echo "${{ github.event.inputs.solutions_to_test }}" | jq -R -c 'split(",") | map(select(length > 0))')
          echo "matrix={\"solution\":$solutions}" >> $GITHUB_OUTPUT
        fi

  test-solution:
    needs: prepare
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
      fail-fast: false
      max-parallel: 10
    
    name: Test Solution ${{ matrix.solution }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup environment
      uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Apply Solution ${{ matrix.solution }}
      run: |
        chmod +x scripts/apply-solution-${{ matrix.solution }}.sh
        bash scripts/apply-solution-${{ matrix.solution }}.sh
      continue-on-error: true
    
    - name: Install dependencies
      run: npm ci --legacy-peer-deps
      continue-on-error: true
      
    - name: Build project
      id: build
      run: |
        # Run build command
        if npm run build 2>&1 | tee build.log; then
          echo "build_status=success" >> $GITHUB_OUTPUT
          echo "✅ Solution ${{ matrix.solution }} SUCCEEDED!"
        else
          echo "build_status=failure" >> $GITHUB_OUTPUT
          echo "❌ Solution ${{ matrix.solution }} FAILED"
        fi
        
    - name: Upload build artifacts
      if: steps.build.outputs.build_status == 'success'
      uses: actions/upload-artifact@v4
      with:
        name: solution-${{ matrix.solution }}-build
        path: |
          build/
          dist/
          *.apk
          *.app
          
    - name: Upload logs
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: solution-${{ matrix.solution }}-logs
        path: |
          *.log
          build-output.txt
          
  summarize:
    needs: test-solution
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Download all artifacts
      uses: actions/download-artifact@v4
      
    - name: Generate summary report
      run: |
        echo "# Build Fix Test Results" > summary.md
        echo "" >> summary.md
        # ... generate comprehensive report ...
```

### Stage 6: Real-time Monitoring and Analysis
/grind Monitor parallel execution with live updates:
```bash
#!/bin/bash
# scripts/monitor-systematic-fix.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Systematic Build Fix Monitor ===${NC}"
echo ""

# Get latest workflow run
RUN_ID=$(gh run list --workflow "systematic-build-fix.yml" --limit 1 --json databaseId -q '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo -e "${YELLOW}Starting new workflow...${NC}"
    gh workflow run systematic-build-fix.yml -f solutions_to_test=all
    sleep 10
    RUN_ID=$(gh run list --workflow "systematic-build-fix.yml" --limit 1 --json databaseId -q '.[0].databaseId')
fi

echo -e "${GREEN}Monitoring workflow run: $RUN_ID${NC}"
echo "View in browser: https://github.com/${GITHUB_REPOSITORY}/actions/runs/$RUN_ID"
echo ""

# Monitor loop with live updates
while true; do
    clear
    echo -e "${BLUE}┌────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│     SYSTEMATIC BUILD FIX PROGRESS          │${NC}"
    echo -e "${BLUE}├────────────────────────────────────────────┤${NC}"
    
    # Get status for each solution
    for solution in {a..k}; do
        status=$(gh run view $RUN_ID --json jobs -q ".jobs[] | select(.name | contains(\"Solution ${solution}\")) | .conclusion // .status" 2>/dev/null || echo "pending")
        
        case "$status" in
            "success") symbol="✅" ;;
            "failure") symbol="❌" ;;
            "in_progress") symbol="⏳" ;;
            *) symbol="⏸️" ;;
        esac
        
        printf "${BLUE}│${NC} Solution ${solution^^} ${symbol} %-26s ${BLUE}│${NC}\n" "${SOLUTION_NAMES[$solution]}"
    done
    
    echo -e "${BLUE}└────────────────────────────────────────────┘${NC}"
    
    # Check if all jobs completed
    if ! gh run view $RUN_ID --json status -q '.status' | grep -q "in_progress"; then
        echo ""
        echo -e "${GREEN}All tests completed!${NC}"
        break
    fi
    
    sleep 5
done

# Generate final report
echo ""
echo "Generating final report..."
bash scripts/generate-fix-report.sh $RUN_ID
```

### Stage 7: Solution Selection and Implementation
/grind Analyze results and implement the best solution:
- Review successful solutions for complexity and side effects
- Compare build times and resource usage
- Check for maintainability and future compatibility
- Select primary solution with fallback options
- Create permanent implementation script
- Test solution in clean environment
- Verify reproducibility across platforms

### Stage 8: Documentation and Prevention
/grind Document the fix and create prevention strategies:
```markdown
# Build Fix Documentation

## Problem Summary
- Root cause: {detailed explanation}
- Symptoms: {list of error messages}
- Affected versions: {version ranges}

## Solution
- Chosen approach: Solution {X}
- Why it works: {technical explanation}
- Implementation steps: {detailed guide}

## Prevention
- Add CI checks for: {specific conditions}
- Version pinning strategy: {recommendations}
- Monitoring alerts: {what to watch for}

## Rollback Plan
- If issues arise: {step-by-step rollback}
- Alternative solutions: {fallback options}
```

## Usage
```bash
# Run the complete systematic fix
/systematic-build-fix

# Or run specific stages
/grind Stage 1: Deep Build Failure Analysis...
/grind Stage 2: Research Known Issues...
# ... continue through all stages
```

## Key Principles
1. **Never Skip Analysis**: Even "obvious" problems benefit from systematic analysis
2. **Parallel Testing**: Test many solutions simultaneously
3. **Document Everything**: Future you will thank present you
4. **Verify Fixes**: Ensure solutions work in clean environments
5. **Plan for Rollback**: Always have an escape route

## Success Metrics
- Build completes successfully
- No regression in other functionality  
- Solution is maintainable
- Fix is properly documented
- CI/CD pipeline remains green