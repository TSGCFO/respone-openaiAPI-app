@echo off
REM Firecrawl MCP Server Quick Start Script for Windows
REM This script helps you quickly start the Firecrawl MCP server for testing

echo ==================================
echo Firecrawl MCP Server Quick Start
echo ==================================
echo.

REM Check if Firecrawl API key is set
if "%FIRECRAWL_API_KEY%"=="" (
  echo Warning: FIRECRAWL_API_KEY environment variable is not set.
  echo.
  echo Please provide your Firecrawl API key.
  echo Get one from: https://firecrawl.dev/app/api-keys
  echo.
  set /p FIRECRAWL_API_KEY="Enter your Firecrawl API key: "
  echo.
)

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: npm is not installed or not in PATH
  echo Please install Node.js and npm first
  pause
  exit /b 1
)

echo Starting Firecrawl MCP Server...
echo.
echo The server will start on an available port (usually 3000 or 3001)
echo Look for the 'Server started at' message below to see the actual URL
echo.
echo Once started:
echo   1. Copy the server URL shown below
echo   2. Open the app at http://localhost:5000
echo   3. Go to Tools ^> MCP Servers ^> Add Server
echo   4. Paste the URL and configure the server
echo.
echo Press Ctrl+C to stop the server
echo ==================================
echo.

REM Start the server
set HTTP_STREAMABLE_SERVER=true
npx -y firecrawl-mcp
