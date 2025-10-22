# Responses starter app

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![NextJS](https://img.shields.io/badge/Built_with-NextJS-blue)
![OpenAI API](https://img.shields.io/badge/Powered_by-OpenAI_API-orange)

This repository contains a NextJS starter app built on top of the [Responses API](https://platform.openai.com/docs/api-reference/responses).
It leverages built-in tools ([web search](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses) and [file search](https://platform.openai.com/docs/guides/tools-file-search)) and implements a chat interface with multi-turn conversation handling.

Features:

- Multi-turn conversation handling
- Web search tool configuration
- Vector store creation & file upload for use with the file search tool
- Function calling
- Streaming responses & tool calls
- Display annotations
- Google Calendar & Gmail integration via 1P connectors

This app is meant to be used as a starting point to build a conversational assistant that you can customize to your needs.

## How to use

1. **Set up the OpenAI API:**

   - If you're new to the OpenAI API, [sign up for an account](https://platform.openai.com/signup).
   - Follow the [Quickstart](https://platform.openai.com/docs/quickstart) to retrieve your API key.

2. **Set the OpenAI API key:**

   2 options:

   - Set the `OPENAI_API_KEY` environment variable [globally in your system](https://platform.openai.com/docs/libraries#create-and-export-an-api-key)
   - Set the `OPENAI_API_KEY` environment variable in the project: Create a `.env` file at the root of the project and add the following line (see `.env.example` for reference):

   ```bash
   OPENAI_API_KEY=<your_api_key>
   ```

3. **Clone the Repository:**

   ```bash
   git clone https://github.com/openai/openai-responses-starter-app.git
   ```

4. **Install dependencies:**

   Run in the project root:

   ```bash
   npm install
   ```

5. **Run the app:**

   ```bash
   npm run dev
   ```

   The app will be available at [`http://localhost:3000`](http://localhost:3000).

## Firecrawl MCP Integration

This app supports Firecrawl MCP server integration, enabling the assistant to scrape, crawl, and extract content from websites. Firecrawl provides powerful web data extraction capabilities through its MCP server.

### Setup (Firecrawl MCP)

1. **Get a Firecrawl API key:**
   - Sign up at [Firecrawl](https://firecrawl.dev)
   - Get your API key from [https://firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)

2. **Install Firecrawl MCP server globally:**
   ```bash
   npm install -g firecrawl-mcp
   ```

3. **Start the Firecrawl MCP server:**
   ```bash
   env HTTP_STREAMABLE_SERVER=true FIRECRAWL_API_KEY=your_api_key npx -y firecrawl-mcp
   ```
   
   This will start the MCP server at `http://localhost:3000/v2/mcp`
   
   **Note:** If port 3000 is already in use by this Next.js app, the Firecrawl server will automatically use the next available port (e.g., 3001). Check the console output to confirm the actual port.

4. **Configure the MCP server in the app:**
   - Open the app at `http://localhost:5000`
   - Navigate to the Tools panel
   - Click on "MCP Servers" section
   - Click "Add Server" and enter:
     - **Server Label:** `Firecrawl`
     - **Server URL:** `http://localhost:3000/v2/mcp` (or the actual port shown in console)
     - **Allowed Tools:** Leave empty to enable all tools
     - **Skip approval:** Toggle ON for easier testing
     - **Enable server:** Toggle ON
   - Click "Add Server"

5. **Enable MCP in the app:**
   - In the Tools panel, toggle "MCP" to ON

### Available Tools

Firecrawl MCP provides these tools to the assistant:
- **firecrawl_scrape**: Extract clean content from a single webpage
- **firecrawl_crawl**: Start an async crawl job to extract content from multiple pages
- **firecrawl_check_crawl_status**: Check the status of a crawl job
- **firecrawl_deep_research**: Conduct comprehensive research using intelligent crawling and analysis
- **firecrawl_map**: Discover and map all URLs on a website

### Demo flow

- Ask the assistant to scrape a website: "Can you scrape the content from https://example.com?"
- Request a deep research: "Do deep research on the latest trends in AI"
- Map a website: "Map all the pages on https://docs.firecrawl.dev"

## Google integration (Calendar & Gmail)

This starter app includes a built-in Google integration that lets the assistant read your calendar and email inbox via OpenAI's 1P connectors. The app performs a secure OAuth (PKCE) flow in your browser, stores tokens per session, and attaches the Google connector to the Responses API tool list at request time.

### Setup (Google OAuth)

1. Create an OAuth 2.0 client for a Web application in your Google Cloud project (see [documentation](https://developers.google.com/identity/protocols/oauth2) for accessing Google APIs with Oauth 2.0 docs).
   - In Google Cloud, go to APIs & Services > Google Auth platform > Clients > Create client > **Web**.
   - Add your redirect URI: `http://localhost:3000/api/google/callback`.
   - Copy the client ID. Create and copy a client secret.
2. Enable APIs in the same project:
   - Google Calendar API
   - Gmail API
3. Configure data access scopes in Google Auth Platform to match what you need. This demo uses:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.modify`
4. Create `.env.local` at the project root and add:

   ```bash
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   # Optional: override if you use a different callback URL
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/google/callback"
   ```

5. Start the dev server if not already running:

   ```bash
   npm run dev
   ```

### Demo flow

- Click "Connect Google Integration" in the UI and complete the OAuth flow; you will be redirected back with `connected=1`.
- Ask the assistant to perform tasks—for example, "Show my next five calendar events," or, "Summarize the most recent wirecutter emails".
- The app will attach Google Calendar and Gmail connectors (via MCP) to the tool list using your access token and stream results back to the UI.
- To invalidate the OAuth session, clear the app cookies (Chrome DevTools > Application > Storage > Cookies). If you only clear `gc_access_token`, the app will use the `gc_refresh_token` to refresh without re-authenticating.

## Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
