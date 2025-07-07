#!/bin/bash

# EAS Build Automation Script
# Integrates with eas-build-automation.py to fetch logs and apply fixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PYTHON_SCRIPT="./eas-build-automation.py"
MAX_RETRY_ATTEMPTS=3
BUILD_TIMEOUT=1800  # 30 minutes

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

# Function to fetch build logs using EAS CLI
fetch_build_log() {
    local build_id=$1
    echo_info "Fetching logs for build $build_id..."
    
    # Get build details
    eas build:view "$build_id" --json > "build-$build_id.json"
    
    # Extract log URL if available
    log_url=$(jq -r '.logs.url // empty' "build-$build_id.json")
    
    if [ -n "$log_url" ]; then
        echo_info "Downloading logs from: $log_url"
        curl -s "$log_url" > "build-$build_id.log"
        return 0
    fi
    
    # Try to get logs from build output
    jq -r '.logs.build // empty' "build-$build_id.json" > "build-$build_id.log"
    
    if [ -s "build-$build_id.log" ]; then
        return 0
    fi
    
    echo_error "Could not fetch build logs"
    return 1
}

# Function to parse specific error patterns
parse_error_log() {
    local log_file=$1
    local error_type=""
    
    echo_info "Parsing error log: $log_file"
    
    # Check for common error patterns
    if grep -q "Minimum supported Gradle version" "$log_file"; then
        error_type="gradle_version"
        local version=$(grep -oP "Minimum supported Gradle version is \K\d+\.\d+" "$log_file" | head -1)
        echo_info "Found Gradle version error: requires $version"
    elif grep -q "Could not find com.android.tools.build:gradle" "$log_file"; then
        error_type="gradle_plugin"
        local plugin=$(grep -oP "Could not find com\.android\.tools\.build:gradle:\K\d+\.\d+\.\d+" "$log_file" | head -1)
        echo_info "Found Gradle plugin error: $plugin"
    elif grep -q "Module was compiled with an incompatible version of Kotlin" "$log_file"; then
        error_type="kotlin_version"
        echo_info "Found Kotlin version conflict"
    elif grep -q "SDK location not found" "$log_file"; then
        error_type="sdk_location"
        echo_info "Found SDK location error"
    elif grep -q "Duplicate class" "$log_file"; then
        error_type="duplicate_class"
        echo_info "Found duplicate class error"
    fi
    
    echo "$error_type"
}

# Function to apply quick fixes
apply_quick_fix() {
    local error_type=$1
    local log_file=$2
    
    case "$error_type" in
        "gradle_version")
            local version=$(grep -oP "Minimum supported Gradle version is \K\d+\.\d+" "$log_file" | head -1)
            echo_info "Updating Gradle to version $version"
            sed -i "s|distributionUrl=.*gradle-.*-all.zip|distributionUrl=https\\\\://services.gradle.org/distributions/gradle-${version}-all.zip|" \
                android/gradle/wrapper/gradle-wrapper.properties
            ;;
        "gradle_plugin")
            local plugin=$(grep -oP "Could not find com\.android\.tools\.build:gradle:\K\d+\.\d+\.\d+" "$log_file" | head -1)
            echo_info "Updating Android Gradle Plugin to $plugin"
            sed -i "s|classpath(\"com.android.tools.build:gradle:.*\")|classpath(\"com.android.tools.build:gradle:${plugin}\")|" \
                android/build.gradle
            ;;
        "kotlin_version")
            echo_info "Updating Kotlin version to 1.9.22"
            sed -i 's|kotlinVersion = ".*"|kotlinVersion = "1.9.22"|' android/build.gradle
            ;;
        "sdk_location")
            echo_info "Creating local.properties with SDK location"
            echo "sdk.dir=/opt/android-sdk" > android/local.properties
            ;;
        "duplicate_class")
            echo_info "Adding packaging options to handle duplicate classes"
            # This is complex, better handled by Python script
            return 1
            ;;
        *)
            echo_warning "No quick fix available for error type: $error_type"
            return 1
            ;;
    esac
    
    return 0
}

# Function to run Python automation
run_python_automation() {
    local build_id=$1
    
    if [ -f "$PYTHON_SCRIPT" ]; then
        echo_info "Running Python automation script..."
        python3 "$PYTHON_SCRIPT" "$build_id"
    else
        echo_error "Python automation script not found: $PYTHON_SCRIPT"
        return 1
    fi
}

# Function to monitor build and apply fixes
monitor_and_fix() {
    local attempt=1
    local build_id=""
    
    while [ $attempt -le $MAX_RETRY_ATTEMPTS ]; do
        echo_info "Starting build attempt $attempt/$MAX_RETRY_ATTEMPTS"
        
        # Start EAS build
        build_output=$(eas build --platform android --profile preview --json --non-interactive 2>&1) || {
            echo_error "Failed to start build"
            echo "$build_output"
            
            # Check if it's a pre-build error
            if echo "$build_output" | grep -q "local.properties"; then
                echo_info "Creating local.properties file"
                echo "sdk.dir=/opt/android-sdk" > android/local.properties
                continue
            fi
            
            return 1
        }
        
        # Extract build ID
        build_id=$(echo "$build_output" | jq -r '.[0].id // empty')
        
        if [ -z "$build_id" ]; then
            echo_error "Could not extract build ID"
            return 1
        fi
        
        echo_success "Build started with ID: $build_id"
        echo_info "Monitoring build progress..."
        
        # Wait for build to complete
        start_time=$(date +%s)
        while true; do
            build_status=$(eas build:view "$build_id" --json | jq -r '.status')
            
            case "$build_status" in
                "finished")
                    echo_success "Build completed successfully!"
                    return 0
                    ;;
                "errored")
                    echo_error "Build failed with errors"
                    
                    # Fetch and analyze logs
                    if fetch_build_log "$build_id"; then
                        error_type=$(parse_error_log "build-$build_id.log")
                        
                        # Try quick fix first
                        if [ -n "$error_type" ] && apply_quick_fix "$error_type" "build-$build_id.log"; then
                            echo_success "Applied quick fix for $error_type"
                            
                            # Commit the fix
                            git add -A
                            git commit -m "fix: Apply automated fix for $error_type error" || true
                        else
                            # Use Python automation for complex fixes
                            run_python_automation "$build_id"
                        fi
                    fi
                    
                    break
                    ;;
                "canceled")
                    echo_warning "Build was canceled"
                    return 1
                    ;;
                *)
                    # Still building
                    current_time=$(date +%s)
                    elapsed=$((current_time - start_time))
                    
                    if [ $elapsed -gt $BUILD_TIMEOUT ]; then
                        echo_error "Build timeout exceeded"
                        return 1
                    fi
                    
                    echo -ne "\rBuild status: $build_status (${elapsed}s elapsed)..."
                    sleep 10
                    ;;
            esac
        done
        
        attempt=$((attempt + 1))
    done
    
    echo_error "Maximum retry attempts reached"
    return 1
}

# Function to analyze historical builds
analyze_history() {
    echo_info "Analyzing build history..."
    
    # Get last 10 builds
    eas build:list --limit 10 --json | jq -r '.[] | select(.status == "errored") | .id' | while read -r build_id; do
        echo_info "Analyzing failed build: $build_id"
        
        if fetch_build_log "$build_id"; then
            error_type=$(parse_error_log "build-$build_id.log")
            echo "  Error type: ${error_type:-unknown}"
        fi
    done
}

# Main execution
main() {
    case "${1:-monitor}" in
        "monitor")
            echo_info "Starting automated build monitoring and fixing..."
            monitor_and_fix
            ;;
        "analyze")
            if [ -n "$2" ]; then
                # Analyze specific build
                echo_info "Analyzing build $2..."
                run_python_automation "$2"
            else
                # Analyze history
                analyze_history
            fi
            ;;
        "fix")
            # Apply fixes and retry build
            echo_info "Applying fixes and retrying build..."
            monitor_and_fix
            ;;
        *)
            echo "Usage: $0 [monitor|analyze|fix] [build-id]"
            echo "  monitor - Start build with automatic error detection and fixing"
            echo "  analyze - Analyze build history or specific build"
            echo "  fix     - Apply fixes and retry build"
            exit 1
            ;;
    esac
}

# Create required directories
mkdir -p logs

# Check dependencies
for cmd in eas jq curl python3; do
    if ! command -v $cmd &> /dev/null; then
        echo_error "Required command not found: $cmd"
        exit 1
    fi
done

main "$@"