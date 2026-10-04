#!/bin/bash

# Pre-push CI check script
# Запускает те же проверки что и в CI перед push

set -e  # Exit on error

echo "🔍 Running pre-push checks..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Check if we're in project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Backend checks
if [ -d "backend" ]; then
    echo "📦 Backend checks..."
    cd backend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm ci --silent
    fi

    # Run tests
    echo "   🧪 Running tests..."
    if npm test --silent; then
        echo -e "   ${GREEN}✅ Tests passed${NC}"
    else
        echo -e "   ${RED}❌ Tests failed${NC}"
        FAILED=1
    fi

    # Check syntax
    echo "   📝 Checking syntax..."
    if node -c src/index.js; then
        echo -e "   ${GREEN}✅ Syntax OK${NC}"
    else
        echo -e "   ${RED}❌ Syntax errors${NC}"
        FAILED=1
    fi

    # Security audit
    echo "   🔒 Running security audit..."
    if npm audit --audit-level=high --production; then
        echo -e "   ${GREEN}✅ No high/critical vulnerabilities${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Security issues found${NC}"
        # Don't fail on audit, just warn
    fi

    cd ..
    echo ""
fi

# Frontend checks
if [ -d "frontend" ]; then
    echo "🎨 Frontend checks..."
    cd frontend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm ci --silent
    fi

    # Build check
    echo "   🏗️  Building..."
    if npm run build; then
        echo -e "   ${GREEN}✅ Build successful${NC}"

        # Check build size
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        echo "   📊 Build size: $BUILD_SIZE"
    else
        echo -e "   ${RED}❌ Build failed${NC}"
        FAILED=1
    fi

    cd ..
    echo ""
fi

# OpenAPI validation
if [ -f "docs/openapi.yaml" ]; then
    echo "📚 Validating OpenAPI spec..."

    # Check if swagger-cli is installed
    if command -v swagger-cli &> /dev/null; then
        if swagger-cli validate docs/openapi.yaml; then
            echo -e "${GREEN}✅ OpenAPI spec valid${NC}"
        else
            echo -e "${RED}❌ OpenAPI spec invalid${NC}"
            FAILED=1
        fi
    else
        echo -e "${YELLOW}⚠️  swagger-cli not installed, skipping${NC}"
        echo "   Install with: npm install -g @apidevtools/swagger-cli"
    fi
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to push.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix before pushing.${NC}"
    exit 1
fi
