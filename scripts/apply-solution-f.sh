#!/bin/bash

# Solution F: Docker Build (Placeholder)
# This script provides instructions for building in a Docker container
# to ensure a clean, isolated build environment

echo "=== Solution F: Docker Build Environment ==="
echo ""
echo "This solution requires Docker to be installed and running."
echo "Docker provides a clean, isolated environment that avoids local conflicts."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "✗ Docker is not installed!"
    echo ""
    echo "To install Docker:"
    echo "- On Ubuntu/Debian: sudo apt-get install docker.io"
    echo "- On macOS: Download Docker Desktop from docker.com"
    echo "- On Windows: Download Docker Desktop from docker.com"
    echo ""
    echo "After installing Docker, run this script again."
    exit 1
fi

# Create Dockerfile
echo "Creating Dockerfile for React Native build environment..."
cat > Dockerfile.android << 'EOF'
# React Native Android Build Environment
FROM reactnativecommunity/react-native-android:latest

# Set working directory
WORKDIR /app

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV ANDROID_HOME=/opt/android
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Create gradle.properties
RUN echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m" > android/gradle.properties && \
    echo "android.useAndroidX=true" >> android/gradle.properties && \
    echo "android.enableJetifier=true" >> android/gradle.properties

# Make gradlew executable
RUN chmod +x android/gradlew

# Prebuild dependencies
RUN cd android && ./gradlew clean

# Default command
CMD ["npm", "run", "android"]
EOF

# Create docker-compose.yml
echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  react-native-build:
    build:
      context: .
      dockerfile: Dockerfile.android
    volumes:
      # Mount source code
      - .:/app
      # Persist node_modules
      - node_modules:/app/node_modules
      # Persist gradle cache
      - gradle_cache:/root/.gradle
      # Mount Android build output
      - ./android/app/build/outputs:/app/android/app/build/outputs
    environment:
      - REACT_NATIVE_PACKAGER_HOSTNAME=localhost
    command: sh -c "cd android && ./gradlew clean assembleDebug"

volumes:
  node_modules:
  gradle_cache:
EOF

# Create build script
echo "Creating Docker build script..."
cat > build-with-docker.sh << 'EOF'
#!/bin/bash

echo "Building React Native app with Docker..."

# Build the Docker image
echo "Building Docker image..."
docker build -f Dockerfile.android -t react-native-build .

# Run the build
echo "Running build in Docker container..."
docker run --rm \
  -v "$(pwd)":/app \
  -v "$(pwd)/android/app/build/outputs":/app/android/app/build/outputs \
  react-native-build \
  sh -c "cd android && ./gradlew clean assembleDebug"

# Check if build was successful
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "✓ Build successful!"
    echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "✗ Build failed!"
    exit 1
fi
EOF

chmod +x build-with-docker.sh

# Create .dockerignore
echo "Creating .dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
android/build
android/app/build
android/.gradle
.git
*.log
.DS_Store
*.apk
*.aab
EOF

echo ""
echo "✓ Docker build environment created!"
echo ""
echo "To build your app in Docker:"
echo "1. Using Docker directly:"
echo "   ./build-with-docker.sh"
echo ""
echo "2. Using docker-compose:"
echo "   docker-compose up --build"
echo ""
echo "Benefits of Docker build:"
echo "- Clean, isolated environment"
echo "- No local dependency conflicts"
echo "- Consistent builds across different machines"
echo "- Automatic handling of Android SDK and build tools"
echo ""
echo "Note: The first build will take longer as it downloads"
echo "the base image and sets up the environment."