#!/bin/bash

# Generate badges for README.md

if [ -z "$1" ]; then
    echo "Usage: ./generate-badges.sh <github-username>"
    exit 1
fi

USERNAME=$1
REPO="hostprint"

echo "# Badges for README.md"
echo ""
echo "Add these to your README.md:"
echo ""
echo "\`\`\`markdown"
echo "## Status"
echo ""
echo "[![Backend CI](https://github.com/$USERNAME/$REPO/workflows/Backend%20CI/badge.svg)](https://github.com/$USERNAME/$REPO/actions/workflows/backend-ci.yml)"
echo "[![Frontend CI](https://github.com/$USERNAME/$REPO/workflows/Frontend%20CI/badge.svg)](https://github.com/$USERNAME/$REPO/actions/workflows/frontend-ci.yml)"
echo "[![Security](https://github.com/$USERNAME/$REPO/workflows/Security%20Scan/badge.svg)](https://github.com/$USERNAME/$REPO/actions/workflows/security.yml)"
echo "[![codecov](https://codecov.io/gh/$USERNAME/$REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/$USERNAME/$REPO)"
echo ""
echo "[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)"
echo "[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)"
echo "[![PostgreSQL Version](https://img.shields.io/badge/postgresql-15-blue)](https://postgresql.org)"
echo ""
echo "## Metrics"
echo ""
echo "![GitHub last commit](https://img.shields.io/github/last-commit/$USERNAME/$REPO)"
echo "![GitHub issues](https://img.shields.io/github/issues/$USERNAME/$REPO)"
echo "![GitHub pull requests](https://img.shields.io/github/issues-pr/$USERNAME/$REPO)"
echo "![GitHub stars](https://img.shields.io/github/stars/$USERNAME/$REPO?style=social)"
echo "\`\`\`"
