#!/bin/bash
cd /Users/sadoewski/projects/hostprint
echo "Building frontend Docker image..."
docker-compose build frontend
echo "Restarting frontend container..."
docker-compose up -d frontend
echo "Done! Frontend is running on http://localhost:3000"
