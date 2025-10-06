#!/bin/bash

# Build script for different deployment scenarios
# Usage: ./scripts/build.sh [config-name] [runtime-base-url]

CONFIG_NAME=${1:-development}
RUNTIME_BASE_URL=${2:-}

echo "🏗️ Building with configuration: $CONFIG_NAME"
if [ ! -z "$RUNTIME_BASE_URL" ]; then
    echo "🔧 Runtime base URL: $RUNTIME_BASE_URL"
    export RUNTIME_BASE_URL="$RUNTIME_BASE_URL"
fi

export BUILD_CONFIG="$CONFIG_NAME"
export SASS_SILENCE_DEPRECATIONS=legacy-js-api

echo "🧹 Cleaning previous build..."
rm -rf dist

echo "📦 Building application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "Available configurations:"
echo "  development          - Local development (default)"
echo "  production          - Production build"
echo "  github-pages-pr     - GitHub Pages PR preview (requires runtime base URL)"
echo "  github-pages-main   - GitHub Pages main branch"
echo "  test               - Test environment"
echo ""
echo "Examples:"
echo "  ./scripts/build.sh development"
echo "  ./scripts/build.sh github-pages-pr /my-app/pr-42"
echo "  ./scripts/build.sh production"