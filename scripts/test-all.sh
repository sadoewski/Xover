#!/bin/bash

# Run all tests with coverage

set -e

echo "🧪 Running all tests..."
echo ""

# Backend tests
echo "📦 Backend tests..."
cd backend

# Make sure DB is ready
echo "   Checking PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
else
    echo "   ⚠️  PostgreSQL not running, tests may fail"
    echo "   Start with: brew services start postgresql@15"
fi

# Run migrations
echo "   Running migrations..."
npm run db:migrate

# Run tests with coverage
echo "   Running tests with coverage..."
npm run test:coverage

# Show coverage summary
echo ""
echo "   Coverage summary:"
cat coverage/coverage-summary.json | jq '.total'

cd ..
echo ""

# Frontend tests (if configured)
if [ -d "frontend" ] && grep -q '"test"' frontend/package.json; then
    echo "🎨 Frontend tests..."
    cd frontend
    npm test
    cd ..
    echo ""
fi

echo "✅ All tests completed!"
