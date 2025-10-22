#!/bin/bash

# Firecrawl MCP Server Quick Start Script
# This script helps you quickly start the Firecrawl MCP server for testing

echo "=================================="
echo "Firecrawl MCP Server Quick Start"
echo "=================================="
echo ""

# Check if Firecrawl API key is set
if [ -z "$FIRECRAWL_API_KEY" ]; then
  echo "⚠️  FIRECRAWL_API_KEY environment variable is not set."
  echo ""
  echo "Please provide your Firecrawl API key."
  echo "Get one from: https://firecrawl.dev/app/api-keys"
  echo ""
  read -p "Enter your Firecrawl API key: " FIRECRAWL_API_KEY
  echo ""
fi

# Check if firecrawl-mcp is installed
if ! command -v firecrawl-mcp &> /dev/null; then
  echo "📦 Firecrawl MCP is not installed globally."
  echo "Installing firecrawl-mcp..."
  npm install -g firecrawl-mcp
  echo ""
fi

echo "🚀 Starting Firecrawl MCP Server..."
echo ""
echo "The server will start on an available port (usually 3000 or 3001)"
echo "Look for the 'Server started at' message below to see the actual URL"
echo ""
echo "Once started:"
echo "  1. Copy the server URL shown below"
echo "  2. Open the app at http://localhost:5000"
echo "  3. Go to Tools > MCP Servers > Add Server"
echo "  4. Paste the URL and configure the server"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="
echo ""

# Start the server
env HTTP_STREAMABLE_SERVER=true FIRECRAWL_API_KEY="$FIRECRAWL_API_KEY" npx -y firecrawl-mcp
