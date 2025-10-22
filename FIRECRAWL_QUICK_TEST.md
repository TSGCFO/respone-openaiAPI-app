# Firecrawl MCP Testing Guide - Quick Start

This is a quick reference guide for testing Firecrawl MCP integration with the Responses starter app.

## What You're Testing

Firecrawl MCP adds web scraping capabilities to the AI assistant, allowing it to:
- Extract content from web pages
- Crawl entire websites  
- Perform deep research using intelligent web navigation
- Map website structures

## Prerequisites Checklist

- [ ] Firecrawl API key from https://firecrawl.dev/app/api-keys
- [ ] Node.js and npm installed
- [ ] This app running on http://localhost:5000

## Quick Start (5 minutes)

### Step 1: Start Firecrawl MCP Server

**Option A - Using the script (Recommended):**
```bash
# Linux/Mac
./start-firecrawl-mcp.sh

# Windows
start-firecrawl-mcp.bat
```

**Option B - Manual start:**
```bash
env HTTP_STREAMABLE_SERVER=true FIRECRAWL_API_KEY=your_api_key npx -y firecrawl-mcp
```

**Important:** Note the URL shown in the console (e.g., `http://localhost:3000/v2/mcp` or `http://localhost:3001/v2/mcp`)

### Step 2: Configure in the App

1. Open http://localhost:5000 in your browser
2. Click the **menu icon** (☰ or three dots) in the top-right corner
3. Click **"MCP Servers"** from the menu
4. Click the **"Add Server"** button
5. Fill in the form:
   - **Server Label:** `Firecrawl`
   - **Server URL:** `http://localhost:3000/v2/mcp` (use the URL from Step 1)
   - **Allowed Tools:** *(leave empty)*
   - **Skip approval:** ✅ ON
   - **Enable server:** ✅ ON
6. Click **"Add Server"** or **"Update Server"**

### Step 3: Enable MCP Tools

1. From the same menu, click **"Tools Settings"**
2. Find the **"MCP"** toggle
3. Turn it **ON** (should show as enabled/green)

### Step 4: Test It!

Go back to the chat and try these prompts:

**Test 1 - Basic Scraping:**
```
Can you scrape https://example.com and tell me what's on the page?
```

**Test 2 - Documentation Scraping:**
```
Scrape https://docs.firecrawl.dev and summarize what Firecrawl does
```

**Test 3 - Website Mapping:**
```
Map all the pages on https://firecrawl.dev
```

**Test 4 - Deep Research:**
```
Do deep research on "web scraping with AI assistants" and give me a summary
```

## Expected Behavior

When working correctly, you should see:
1. The assistant acknowledging it will use the Firecrawl tool
2. Tool execution progress (e.g., "Calling firecrawl_scrape...")
3. Structured content extracted from the website
4. A summary or analysis based on the scraped content

## Troubleshooting

### Server Won't Start
- Check if port 3000 is available
- Verify your Firecrawl API key is valid
- Try: `npm install -g firecrawl-mcp`

### Tools Not Available
- Verify MCP toggle is ON in Tools Settings
- Check that Firecrawl server is enabled (green checkmark)
- Confirm the server URL matches the console output

### Connection Errors
- Ensure Firecrawl MCP server is still running
- Check the URL in the browser matches the server URL
- Try restarting the Firecrawl MCP server

### Rate Limits
- Free tier has usage limits
- Check your quota at https://firecrawl.dev/app
- Wait a few minutes if you hit the limit

## Advanced Usage

### Custom Tool Selection
Only want specific tools? Add them to "Allowed Tools":
```
firecrawl_scrape,firecrawl_deep_research
```

### Multiple MCP Servers
You can add multiple MCP servers! Each contributes its tools to the assistant.

### Approval Mode
Turn OFF "Skip approval" if you want to review each tool call before execution.

## Testing Checklist

Use this to verify the integration works:

- [ ] Firecrawl MCP server starts successfully
- [ ] Server appears in MCP Servers list in the app
- [ ] MCP toggle is ON in Tools Settings
- [ ] Assistant can scrape a simple page (example.com)
- [ ] Assistant can extract meaningful content
- [ ] Deep research generates comprehensive results
- [ ] Website mapping discovers multiple pages

## Getting Help

- Firecrawl Documentation: https://docs.firecrawl.dev
- Firecrawl MCP Server: https://github.com/firecrawl/firecrawl-mcp-server
- OpenAI MCP Docs: https://platform.openai.com/docs/guides/tools-remote-mcp

## What's Happening Behind the Scenes

1. **Your prompt** → Next.js app
2. **App** → OpenAI Responses API with MCP tools list
3. **OpenAI** → Decides to use firecrawl_scrape tool
4. **OpenAI** → Calls your local Firecrawl MCP server
5. **Firecrawl** → Uses your API key to scrape the website
6. **Firecrawl** → Returns structured content
7. **OpenAI** → Processes content and generates response
8. **App** → Displays the final answer to you

## Success Criteria

You've successfully tested Firecrawl MCP when:
✅ Server starts without errors
✅ Server appears in the app's MCP Servers list
✅ Tools are available to the assistant
✅ Assistant can successfully scrape and analyze web content
✅ Results are relevant and well-formatted

Happy testing! 🚀
