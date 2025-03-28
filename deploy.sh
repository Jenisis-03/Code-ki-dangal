#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Please create one based on .env.example"
  exit 1
fi

# Load environment variables
source .env

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building the application..."
npm run build

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🚀 Starting the application..."
npm start