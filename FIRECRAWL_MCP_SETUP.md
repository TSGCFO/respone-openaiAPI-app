# Firecrawl MCP Integration Guide

This guide provides step-by-step instructions for testing the Firecrawl MCP server integration with the Responses starter app.

## What is Firecrawl MCP?

Firecrawl MCP is a Model Context Protocol (MCP) server that provides web scraping and crawling capabilities. It allows AI assistants to:
- Extract clean, structured content from web pages
- Crawl entire websites to gather information
- Perform deep research by intelligently navigating and analyzing web content
- Map website structures to understand navigation and content organization

## Prerequisites

1. This Next.js Responses app running locally
2. A Firecrawl API key (free tier available)
3. Node.js and npm installed

## Step-by-Step Setup

### 1. Get Your Firecrawl API Key

1. Visit [https://firecrawl.dev](https://firecrawl.dev)
2. Sign up for a free account
3. Navigate to [https://firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)
4. Create and copy your API key

### 2. Install Firecrawl MCP Server

Install the Firecrawl MCP server globally on your system:

```bash
npm install -g firecrawl-mcp
```

### 3. Start the Firecrawl MCP Server

Run the Firecrawl MCP server with your API key:

```bash
env HTTP_STREAMABLE_SERVER=true FIRECRAWL_API_KEY=your_actual_api_key npx -y firecrawl-mcp
```

Replace `your_actual_api_key` with your actual Firecrawl API key.

**Important:** The server will try to start on port 3000. If this port is already in use (e.g., by this Next.js app on port 5000), it will automatically use the next available port. Check the console output to see which port it's using. You'll see a message like:

```
Server started at http://localhost:3001/v2/mcp
```

Keep this terminal window open while testing.

### 4. Configure the App

1. **Start the Next.js app** (in a separate terminal):
   ```bash
   cd /path/to/responses-starter-app
   npm run dev
   ```

2. **Open the app** in your browser: [http://localhost:5000](http://localhost:5000)

3. **Add Firecrawl MCP Server:**
   - Look for the Tools panel on the right side (or open it via the menu on mobile)
   - Scroll to the "MCP Servers" section
   - Click the "Add Server" button
   - Fill in the form:
     - **Server Label:** `Firecrawl`
     - **Server URL:** `http://localhost:3000/v2/mcp` (or whatever port was shown in step 3)
     - **Allowed Tools:** Leave empty (this enables all available tools)
     - **Skip approval:** Toggle ON (recommended for testing)
     - **Enable server:** Toggle ON
   - Click "Add Server"

4. **Enable MCP Tools:**
   - In the Tools panel, find the "MCP" toggle
   - Turn it ON

5. **Verify Setup:**
   - You should see the Firecrawl server listed in the MCP Servers section
   - It should have a green checkmark indicating it's enabled

### 5. Test the Integration

Try these example prompts to test different Firecrawl capabilities:

#### Basic Scraping
```
Can you scrape the content from https://docs.firecrawl.dev and summarize what Firecrawl does?
```

#### Website Mapping
```
Map all the pages on https://firecrawl.dev and tell me what sections they have
```

#### Deep Research
```
Do deep research on "web scraping best practices" and give me a comprehensive summary
```

#### Crawling Multiple Pages
```
Crawl https://docs.firecrawl.dev starting from the main page and summarize the key features
```

## Available Tools

When properly configured, the assistant will have access to these Firecrawl tools:

| Tool Name | Description | Use Case |
|-----------|-------------|----------|
| `firecrawl_scrape` | Extract content from a single webpage | Quick content extraction from one URL |
| `firecrawl_crawl` | Async crawl job for multiple pages | Gathering content from related pages |
| `firecrawl_check_crawl_status` | Check crawl job progress | Monitoring ongoing crawl operations |
| `firecrawl_deep_research` | Comprehensive research with analysis | In-depth research on topics |
| `firecrawl_map` | Map all URLs on a website | Understanding site structure |

## Troubleshooting

### Port Conflict
**Problem:** Firecrawl server fails to start or uses unexpected port

**Solution:** Check the console output when starting Firecrawl MCP. It will show the actual URL. Update the Server URL in the app accordingly.

### Connection Refused
**Problem:** App shows "connection refused" when trying to use Firecrawl tools

**Solutions:**
1. Verify the Firecrawl MCP server is still running (check terminal)
2. Confirm the Server URL in the app matches the actual port
3. Ensure MCP toggle is ON in the Tools panel
4. Check that the Firecrawl server is enabled (green checkmark)

### API Key Errors
**Problem:** Firecrawl returns authentication errors

**Solutions:**
1. Verify your API key is correct and active at [https://firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)
2. Restart the Firecrawl MCP server with the correct API key
3. Check for any typos in the environment variable

### Tools Not Appearing
**Problem:** Assistant doesn't seem to have access to Firecrawl tools

**Solutions:**
1. Verify MCP is toggled ON in Tools panel
2. Check that the Firecrawl server is enabled (toggle should be ON)
3. Try refreshing the page
4. Check browser console for any error messages

## Advanced Configuration

### Limiting Tools
If you only want specific Firecrawl tools available, you can specify them in the "Allowed Tools" field:

```
firecrawl_scrape,firecrawl_deep_research
```

This comma-separated list restricts which tools the assistant can use.

### Multiple MCP Servers
You can add multiple MCP servers simultaneously. Each will contribute its tools to the assistant's capabilities. For example:
- Firecrawl for web scraping
- Other MCP servers for different data sources
- Custom MCP servers you build

### Approval Settings
The "Skip approval" toggle controls whether the assistant needs to ask permission before using tools:
- **ON (recommended for testing):** Tools execute automatically
- **OFF:** App will prompt you before each tool execution

## Security Notes

1. **API Key:** Keep your Firecrawl API key secure. Don't commit it to version control.
2. **Local Server:** The Firecrawl MCP server runs locally on your machine. No data is sent elsewhere except to Firecrawl's API.
3. **Rate Limits:** Free tier API keys have rate limits. Monitor your usage at [https://firecrawl.dev/app](https://firecrawl.dev/app)

## Next Steps

Once you've tested the basic integration:
1. Try combining Firecrawl with other tools (web search, file search, etc.)
2. Experiment with different websites and scraping scenarios
3. Build custom workflows that leverage web data extraction
4. Explore the Firecrawl API documentation for advanced features

## Resources

- [Firecrawl Website](https://firecrawl.dev)
- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Firecrawl MCP Server GitHub](https://github.com/firecrawl/firecrawl-mcp-server)
- [OpenAI MCP Documentation](https://platform.openai.com/docs/guides/tools-remote-mcp)
