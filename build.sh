#!/bin/bash
set -e
cd /vercel/path0

# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Create Vercel output structure
mkdir -p .vercel/output/static
cp -r dist/* .vercel/output/static/
echo '{"version":3}' > .vercel/output/config.json

echo "Build complete"
