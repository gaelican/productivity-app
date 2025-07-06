#!/bin/bash

# Setup script for Termux Android development environment
echo "================================================"
echo "Setting up React Native development in Termux"
echo "================================================"
echo ""

# Function to check if a package is installed
check_package() {
    if dpkg -s "$1" &> /dev/null; then
        echo "✓ $1 is already installed"
        return 0
    else
        echo "✗ $1 is not installed"
        return 1
    fi
}

# Function to check npm package
check_npm_package() {
    if npm list -g "$1" &> /dev/null 2>&1; then
        echo "✓ $1 is already installed globally"
        return 0
    else
        echo "✗ $1 is not installed globally"
        return 1
    fi
}

echo "Step 1: Checking Termux packages..."
echo "-----------------------------------"

# Update package list
echo "Updating package list..."
pkg update -y

# Check and install required packages
PACKAGES="nodejs python build-essential git"
for package in $PACKAGES; do
    if ! check_package "$package"; then
        echo "Installing $package..."
        pkg install -y "$package"
    fi
done

echo ""
echo "Step 2: Checking Node.js and npm..."
echo "-----------------------------------"
node_version=$(node --version 2>/dev/null)
npm_version=$(npm --version 2>/dev/null)

if [ -z "$node_version" ]; then
    echo "Error: Node.js is not properly installed"
    exit 1
else
    echo "✓ Node.js version: $node_version"
    echo "✓ npm version: $npm_version"
fi

echo ""
echo "Step 3: Installing project dependencies..."
echo "-----------------------------------------"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in the mobile app directory"
    echo "Please run this script from: /data/data/com.termux/files/home/monorepo-todo-app/apps/mobile"
    exit 1
fi

# Clean install
echo "Cleaning previous installations..."
rm -rf node_modules package-lock.json

echo "Installing dependencies (this may take a few minutes)..."
npm install

echo ""
echo "Step 4: Setting up Expo..."
echo "--------------------------"

# Install Expo CLI locally (project dependency)
if ! npx expo --version &> /dev/null 2>&1; then
    echo "Installing Expo CLI as project dependency..."
    npm install --save-dev expo-cli
fi

echo "✓ Expo is ready to use with npx"

echo ""
echo "Step 5: Creating shortcuts..."
echo "-----------------------------"

# Create a simple launcher script
cat > start-web.sh << 'EOF'
#!/bin/bash
echo "Starting React Native app in web mode..."
echo "Open your browser at: http://localhost:19006"
echo ""
npx expo start --web
EOF

chmod +x start-web.sh
echo "✓ Created start-web.sh launcher"

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "To test the app, you can:"
echo ""
echo "1. Web Mode (Recommended):"
echo "   ./start-web.sh"
echo "   OR"
echo "   npm run web"
echo ""
echo "2. Expo Go App:"
echo "   npm start"
echo "   Then scan QR code with Expo Go app"
echo ""
echo "3. Run test script:"
echo "   ./test-web.sh"
echo ""
echo "For detailed instructions, see: TESTING_GUIDE_TERMUX.md"
echo ""