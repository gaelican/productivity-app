#!/bin/bash
# Solution F: Docker build - Create containerized build environment

echo "=== Applying Solution F: Docker Build Environment ==="

# Create Dockerfile for Android build environment
cat > Dockerfile.android << 'EOF'
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
ENV ANDROID_SDK_ROOT=$ANDROID_HOME

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    openjdk-17-jdk \
    build-essential \
    python3 \
    python3-pip \
    ruby \
    ruby-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn

# Install Android SDK
RUN mkdir -p $ANDROID_HOME/cmdline-tools \
    && cd $ANDROID_HOME/cmdline-tools \
    && curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
    && unzip commandlinetools.zip \
    && rm commandlinetools.zip \
    && mv cmdline-tools latest

# Accept Android licenses
RUN yes | sdkmanager --licenses

# Install Android SDK components
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;25.1.8937393" \
    "cmake;3.22.1"

# Install React Native CLI
RUN npm install -g react-native-cli @react-native-community/cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy project files
COPY . .

# Build script
RUN echo '#!/bin/bash\n\
cd /app\n\
# Clean previous builds\n\
cd android && ./gradlew clean\n\
# Build APK\n\
./gradlew assembleRelease\n\
# Copy APK to output\n\
cp app/build/outputs/apk/release/*.apk /output/' > /build.sh \
    && chmod +x /build.sh

CMD ["/build.sh"]
EOF

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  android-builder:
    build:
      context: .
      dockerfile: Dockerfile.android
    volumes:
      - ./:/app
      - ./build-output:/output
      - gradle-cache:/root/.gradle
      - yarn-cache:/usr/local/share/.cache/yarn
    environment:
      - GRADLE_OPTS=-Xmx4096m -XX:MaxMetaspaceSize=512m
      - _JAVA_OPTIONS=-Xmx4096m
    command: /build.sh

volumes:
  gradle-cache:
  yarn-cache:
EOF

# Create build script for Docker
cat > build-with-docker.sh << 'EOF'
#!/bin/bash

echo "Building React Native app with Docker..."

# Create output directory
mkdir -p build-output

# Build and run Docker container
docker-compose build android-builder
docker-compose run --rm android-builder

# Check if build succeeded
if [ -f "build-output/app-release.apk" ]; then
    echo "Build successful! APK available at: build-output/app-release.apk"
else
    echo "Build failed. Check logs above for errors."
    exit 1
fi
EOF

chmod +x build-with-docker.sh

# Create minimal Docker-compatible gradle config
cat > android/gradle.properties.docker << 'EOF'
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
org.gradle.caching=true

# React Native
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=false
hermesEnabled=true

# Build optimizations
android.enableBuildCache=true
android.buildCacheDir=/gradle-cache/build-cache
android.enableR8=true
EOF

# Create EAS-specific Docker configuration
cat > eas-docker-build.sh << 'EOF'
#!/bin/bash

# This script configures the build for EAS environment
if [ "$EAS_BUILD" = "true" ]; then
    echo "Configuring for EAS build environment..."
    
    # Use Docker-compatible gradle properties
    cp android/gradle.properties.docker android/gradle.properties
    
    # Set memory limits for EAS
    export GRADLE_OPTS="-Xmx14g -XX:MaxMetaspaceSize=512m"
    export _JAVA_OPTIONS="-Xmx14g"
    
    # Disable gradle daemon in EAS
    echo "org.gradle.daemon=false" >> android/gradle.properties
fi

# Run the build
cd android && ./gradlew assembleRelease
EOF

chmod +x eas-docker-build.sh

# Create GitHub Action for Docker build
mkdir -p .github/workflows
cat > .github/workflows/docker-build.yml << 'EOF'
name: Docker Android Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Android APK with Docker
      run: |
        docker-compose build android-builder
        docker-compose run --rm android-builder
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      if: success()
      with:
        name: app-release
        path: build-output/app-release.apk
EOF

echo "Solution F (Docker build environment) applied successfully!"
echo "To build with Docker, run: ./build-with-docker.sh"