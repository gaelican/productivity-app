#!/bin/bash

# Test script for running React Native app in web mode from Termux
# This script sets up the environment and starts the web server with helpful output

echo "========================================="
echo "React Native Web Test Script for Termux"
echo "========================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first:"
    echo "pkg install nodejs"
    exit 1
fi

# Set the port (use default 19006 or custom)
PORT=${PORT:-19006}
echo "Using port: $PORT"

# Check if port is already in use
if lsof -i:$PORT &> /dev/null 2>&1; then
    echo "Warning: Port $PORT is already in use."
    echo "Trying alternative port..."
    PORT=$((PORT + 1))
    echo "Using port: $PORT"
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down development server..."
    exit 0
}
trap cleanup INT TERM

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in the mobile app directory"
    echo "Please run this script from: /data/data/com.termux/files/home/monorepo-todo-app/apps/mobile"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clear Metro cache
echo "Clearing Metro cache..."
npx expo start -c --web --non-interactive &> /dev/null &
sleep 2
pkill -f "expo start"

echo ""
echo "Starting development server..."
echo "========================================="
echo ""
echo "Widget Sync Test Instructions:"
echo "1. Open your browser at: http://localhost:$PORT"
echo "2. Look for the widget sync indicator in the header"
echo "3. Create or edit tasks to test sync functionality"
echo "4. Check browser console (F12) for sync logs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================="
echo ""

# Start the server with enhanced logging
PORT=$PORT npx expo start --web --dev