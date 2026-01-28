#!/bin/bash

# ============================================================================
# Xenolexia Day 1 Setup Script
# Run this to complete the Day 1 environment setup
# ============================================================================

set -e

echo "🚀 Xenolexia Day 1 Setup"
echo "========================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Husky
echo "🐶 Setting up Husky..."
npx husky install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Run type check
echo "📝 Running TypeScript check..."
npm run typecheck || echo "⚠️ TypeScript errors found (will fix in development)"

# Run linting
echo "🔍 Running ESLint..."
npm run lint:check || echo "⚠️ Lint errors found (will fix in development)"

# Run formatter check
echo "✨ Checking Prettier formatting..."
npm run format:check || echo "⚠️ Format issues found (run 'npm run format' to fix)"

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️ Some tests may fail initially"

echo ""
echo "✅ Day 1 Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Fix any TypeScript errors: npm run typecheck"
echo "  2. Fix lint errors: npm run lint"
echo "  3. Format code: npm run format"
echo "  4. Run the app: npm run ios OR npm run android"
echo ""
echo "Commands available:"
echo "  npm run start       - Start Metro bundler"
echo "  npm run ios         - Run on iOS simulator"
echo "  npm run android     - Run on Android emulator"
echo "  npm run lint        - Lint and fix files"
echo "  npm run format      - Format all files"
echo "  npm run typecheck   - TypeScript checking"
echo "  npm run test        - Run tests"
echo "  npm run validate    - Run all checks"
echo ""
