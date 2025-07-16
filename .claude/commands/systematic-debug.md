# Systematic Debug Command

This command implements a comprehensive, multi-stage debugging approach for complex build errors. It breaks down the problem into manageable stages and uses the /grind command to thoroughly analyze each stage.

## Overview
When facing persistent build errors, this systematic approach:
1. Analyzes all past failures to identify patterns
2. Researches framework-specific known issues
3. Examines dependency conflicts
4. Tests multiple solutions in parallel
5. Documents the working solution

## Stage 1: Deep Analysis of Past Build Failures
/grind Analyze all past build failures and error logs. Look for:
- Common error patterns across multiple builds
- Specific modules or dependencies that consistently cause issues
- Environmental differences between successful and failed builds
- Error frequency and timing patterns
Create a comprehensive summary of findings with categorized error types.

## Stage 2: Research Framework Known Issues
/grind Research known issues for the specific framework version (e.g., React Native 0.73.6). Check:
- Official GitHub issues and discussions
- Framework release notes and breaking changes
- Community forums and Stack Overflow
- Migration guides and compatibility matrices
Document all relevant findings and potential solutions.

## Stage 3: Analyze Dependency Conflicts
/grind Perform deep dependency analysis:
- Check for version mismatches between dependencies
- Identify duplicate or conflicting packages
- Analyze transitive dependencies
- Review package.json and lock files for inconsistencies
- Check native module compatibility
Create a dependency conflict report with resolution strategies.

## Stage 4: Research Build Tool Compatibility
/grind Investigate build tool requirements and compatibility:
- Gradle version requirements
- JDK/Java version compatibility
- Android SDK and build tools versions
- Native toolchain requirements
- Platform-specific build requirements
Document all version requirements and current mismatches.

## Stage 5: Identify All Possible Solutions
/grind Based on previous analysis, create a comprehensive list of potential solutions:
- Categorize solutions by approach (version fixes, workarounds, patches)
- Estimate implementation complexity for each
- Identify dependencies between solutions
- Prioritize based on likelihood of success
Create at least 10 different solution approaches.

## Stage 6: Create Parallel Testing Infrastructure
/grind Implement parallel testing system:
- Create individual solution implementation scripts
- Build GitHub Actions workflow for parallel execution
- Implement monitoring and reporting system
- Set up artifact collection for successful builds
- Create solution comparison matrix
Deploy infrastructure to test all solutions simultaneously.

## Stage 7: Deploy and Monitor Solutions
/grind Execute parallel solution testing:
- Trigger all solution builds simultaneously
- Monitor build progress in real-time
- Collect and analyze build logs
- Identify successful solutions
- Analyze failure patterns in unsuccessful solutions
Create comprehensive test report with results.

## Stage 8: Document Working Solution
/grind Document the successful solution:
- Create step-by-step implementation guide
- Document why the solution works
- Identify potential side effects or limitations
- Create automated setup script
- Update project documentation
Ensure solution is reproducible and well-documented.

## Usage Example
```bash
# Start with Stage 1
/grind Analyze all past build failures...

# After Stage 1 completes, move to Stage 2
/grind Research React Native 0.73.6 known issues...

# Continue through each stage sequentially
```

## Key Principles
1. **Systematic Approach**: Never skip stages, even if you think you know the problem
2. **Parallel Testing**: Test multiple solutions simultaneously to save time
3. **Documentation**: Document every finding and decision
4. **Reproducibility**: Ensure all solutions can be reproduced
5. **Root Cause Analysis**: Don't just fix symptoms, understand the underlying issue

## When to Use This Command
- Persistent build errors that resist simple fixes
- Complex dependency conflicts
- Framework version upgrade issues
- Multi-platform build problems
- When previous attempts have failed

## Expected Outcomes
- Identification of root cause(s)
- Multiple tested solutions
- Clear documentation of what works and why
- Automated scripts for applying the fix
- Prevention strategies for future issues