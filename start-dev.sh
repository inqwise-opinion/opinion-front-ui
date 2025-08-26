#!/bin/bash

# Opinion Front UI - Development Server Startup Script
echo "🚀 Starting Opinion Front UI Development Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the development server
echo "🌐 Starting Vite development server..."
echo "📍 Server will be available at: http://localhost:3000"
echo "🔄 Hot reload enabled - changes will be reflected automatically"
echo "🔇 Sass deprecation warnings are suppressed"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================================================="
export SASS_SILENCE_DEPRECATIONS=legacy-js-api
npm run dev
