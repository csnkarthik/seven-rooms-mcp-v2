# SevenRooms MCP Server

HTTP-based Model Context Protocol (MCP) server exposing tools and resources for SevenRooms reservations and availability. Uses `StreamableHTTPServerTransport` (HTTP + SSE) instead of stdio. Built with TypeScript and the official `@modelcontextprotocol/sdk`.

## Features
- `make_reservations` tool: Create restaurant reservations with guest details
- `available_time_slot` resource: Query available reservation time slots
- TypeScript + Zod validation
- Streamable HTTP transport (JSON responses + optional SSE streaming)
- Ready for Azure App Service deployment via GitHub Actions

## Project Structure
```
src/
  server.ts                         # Main MCP HTTP server (/mcp endpoint)
  tools/makeReservation.ts          # make_reservations tool registration
  resources/available_time_slot.ts  # available_time_slot resource registration
test/                               # Integration tests
.env.example                        # Example environment vars
tsconfig.json
package.json
.github/workflows/azure-deploy.yml  # CI/CD workflow to Azure App Service
```

## Environment Variables
| Name | Required | Description |
|------|----------|-------------|
| SEVENROOMS_API_KEY | Yes | Authentication for SevenRooms API |
| SEVENROOMS_API_URL | Yes | Base API URL (e.g. https://api.sevenrooms.com) |
| PORT | Optional | Listening port (App Service sets automatically) |

Copy `.env.example` to `.env` for local use:
```
SEVENROOMS_API_KEY=your_key_here
SEVENROOMS_API_URL=https://api.sevenrooms.com
```

## Local Development
```bash
npm install
npm run build
npm start              # starts HTTP server on PORT (default 3000)
# or
npm run start:dev      # tsx live-reload
```
Server endpoints:
- `POST /mcp` – JSON-RPC MCP requests (initialize, tools/list, resources/list, tools/call, etc.)
- `GET /mcp`  – SSE stream (if using streaming scenarios)
- `DELETE /mcp` – Close session (stateful mode; stateless here so optional)
- `GET /health` – Simple health probe

### Sample Initialize Request
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"1.0",
      "clientInfo":{"name":"local-client","version":"1.0"},
      "capabilities":{}
    }
  }'
```

### List Tools
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Call make_reservations Tool (example)
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"make_reservations",
      "arguments":{
        "date":"2025-12-20",
        "time":"19:00",
        "party_size":2,
        "first_name":"Jane",
        "last_name":"Doe",
        "email":"jane@example.com",
        "phone":"+15555550123"
      }
    }
  }'
```

## Tools & Resources Details

### Tool: make_reservations
Input fields:
```
date, time, party_size, first_name, last_name, email, phone
```
Returns success or detailed error text from SevenRooms API.

### Resource: available_time_slot
URI format:
```
available://YYYY-MM-DD/HH:MM/party_size
```
Returns JSON: `{ "available_times": ["18:00", "18:30", ...] }` filtered for entries where `type === 'book`.

## SevenRooms API Endpoints Used
- Reservations: `POST {SEVENROOMS_API_URL}/reservations`
- Availability: `GET {SEVENROOMS_API_URL}/availability` with query params `date`, `time`, `party_size`

Adjust endpoint paths if your SevenRooms account differs.

## Azure App Service Deployment

### 1. Create Azure Resources (CLI Example)
```bash
az group create -n sevenrooms-rg -l eastus
az appservice plan create -g sevenrooms-rg -n sevenrooms-plan --sku B1 --is-linux
az webapp create -g sevenrooms-rg -p sevenrooms-plan -n <WEBAPP_NAME> --runtime "NODE:18-lts"
```

### 2. Configure App Settings
```bash
az webapp config appsettings set -g sevenrooms-rg -n <WEBAPP_NAME> --settings \
  SEVENROOMS_API_KEY="<secret>" \
  SEVENROOMS_API_URL="https://api.sevenrooms.com"
```
Azure injects `PORT` automatically; do not hardcode it unless needed.

### 3. GitHub Secrets
Add in repo Settings → Actions → Secrets:
- `AZURE_WEBAPP_NAME` = <WEBAPP_NAME>
- `AZURE_WEBAPP_PUBLISH_PROFILE` = publish profile XML pasted verbatim

### 4. Workflow (`azure-deploy.yml`)
Steps: checkout, setup Node + cache, install (skip if cache hit), test, build, list build output, deploy.

### 5. Verify Deployment
```bash
curl https://<WEBAPP_NAME>.azurewebsites.net/health
curl -X POST https://<WEBAPP_NAME>.azurewebsites.net/mcp \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0","clientInfo":{"name":"remote","version":"1.0"},"capabilities":{}}}'
```

## Logging & Observability
- Use `console.error()` for server logs (stderr captured by App Service).
- Add Application Insights: set `APPINSIGHTS_INSTRUMENTATIONKEY` or connection string.
- Consider structured logging (JSON) for easier analysis.

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 404 /mcp | Build missing or wrong start path | Ensure `npm run build` and start uses `node build/server.js` |
| 500 SevenRooms errors | Invalid API key or payload | Verify env vars & input fields |
| Timeout | Low SKU or network latency | Increase plan size / adjust retry | 
| Not Acceptable | Missing Accept header | Use `Accept: application/json` (JSON-only enabled) |
| Capabilities error | Missing `capabilities` in initialize | Include `"capabilities":{}` |

## Production Recommendations
- Use at least B1 plan; scale out based on CPU or HTTP queue length.
- Restrict ingress with Access Restrictions or Front Door.
- Rotate `SEVENROOMS_API_KEY` regularly.
- Implement retries for transient SevenRooms failures (429, 5xx).
- Add rate limiting if exposed publicly.

## Contributing
1. Branch from `main`
2. Implement changes in `src/`
3. `npm test && npm run build`
4. PR and merge to trigger deployment

## License
MIT (update as needed).

## References
- MCP Docs: https://modelcontextprotocol.io/
- SDK Repo: https://github.com/modelcontextprotocol/typescript-sdk
- SevenRooms API Docs: (refer to account-specific portal)
# SevenRooms MCP Server

A Model Context Protocol (MCP) server for managing restaurant reservations with SevenRooms. Built according to the [MCP specification](https://modelcontextprotocol.io/docs/develop/build-server) using TypeScript and the official `@modelcontextprotocol/sdk`.

## Features

- **make_reservations** Tool: Create restaurant reservations with guest details
- **available_time_slot** Resource: Query available reservation time slots
- Fully typed with TypeScript and Zod validation
- STDIO-based communication for seamless MCP integration
- Azure App Service deployment ready

## Project Structure

```
src/
  index.ts          # Main MCP server with tools and resources
test/
  makeReservation.test.js   # Unit tests for make_reservations tool
  availableTimeSlot.test.js # Unit tests for available_time_slot resource
.env.example        # Example environment variables
tsconfig.json       # TypeScript configuration
package.json        # Project dependencies and scripts
.github/
  workflows/
    azure-deploy.yml # GitHub Actions CI/CD workflow
```

## Prerequisites

- Node.js >= 16
- npm
- SevenRooms API key and base URL

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your SevenRooms credentials:

```bash
cp .env.example .env
```

Then edit `.env`:

```
SEVENROOMS_API_KEY=your_sevenrooms_api_key_here
SEVENROOMS_API_URL=https://api.sevenrooms.com
```

### 3. Build the Server

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

### 4. Run Tests

```bash
npm test
```

Expected output:
```
  available_time_slot resource
    ✓ throws when required fields missing
    ✓ returns only times with type == "book"

  make_reservations tool
    ✓ throws when required fields missing
    ✓ calls SevenRooms reservations endpoint and returns data

  4 passing
```

### 5. Start the Server

For production:
```bash
npm start
```

For development with auto-reload:
```bash
npm run start:dev
```

The server will start on stdio, ready for MCP clients to connect.

## MCP Tools & Resources

### Tool: make_reservations

Makes a reservation at a restaurant through SevenRooms.

**Input Schema:**
```json
{
  "date": "YYYY-MM-DD (e.g., 2025-12-25)",
  "time": "HH:MM (e.g., 19:00)",
  "party_size": 4,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "555-1234"
}
```

**Response:**
Returns the SevenRooms API response with reservation confirmation details (ID, status, etc.).

### Resource: available_time_slot

Queries available reservation time slots for a given date, time, and party size.

**URI Format:**
```
available://YYYY-MM-DD/HH:MM/party_size
```

**Example:**
```
available://2025-12-25/19:00/4
```

**Response:**
```json
{
  "available_times": ["18:00", "18:30", "19:00", "19:30"]
}
```

The resource automatically filters to only include times where `type === 'book'` from the SevenRooms availability API.

## SevenRooms API Integration

The server calls the following SevenRooms endpoints:

### Reservations Endpoint
- **URL:** `{SEVENROOMS_API_URL}/reservations`
- **Method:** POST
- **Auth:** Bearer token in `Authorization` header
- **Payload:**
  ```json
  {
    "datetime": "2025-12-25T19:00",
    "party_size": 4,
    "guest": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    }
  }
  ```

### Availability Endpoint
- **URL:** `{SEVENROOMS_API_URL}/availability`
- **Method:** GET
- **Auth:** Bearer token in `Authorization` header
- **Query Params:** `date`, `time`, `party_size`

**Note:** Adjust endpoints and request payloads if your SevenRooms API account requires different paths or authentication methods.

## Testing

The project includes unit tests using Mocha, Chai, and Nock (for HTTP mocking).

Run tests:
```bash
npm test
```

Tests cover:
- Input validation for both tool and resource
- Mocked SevenRooms API responses
- Filtering logic for available time slots (type === 'book')

## Azure Deployment

### Prerequisites

1. Azure App Service instance
2. GitHub repository with this code
3. Azure publish profile exported

### Setup Steps

1. **Create Azure App Service**
   - Create a new Web App (Node.js 18 LTS or later)
   - Copy the publish profile XML

2. **Configure GitHub Secrets**
   - In your GitHub repository, go to Settings → Secrets and variables → Actions
   - Add these secrets:
     - `AZURE_WEBAPP_NAME` — The name of your Azure Web App
     - `AZURE_WEBAPP_PUBLISH_PROFILE` — The publish profile XML content

3. **Set App Service Configuration**
   - In Azure portal, go to your App Service → Configuration
   - Add these application settings:
     - `SEVENROOMS_API_KEY` — Your SevenRooms API key
     - `SEVENROOMS_API_URL` — Your SevenRooms API base URL (e.g., `https://api.sevenrooms.com`)
     - `PORT` — Leave blank to auto-bind (Azure sets this automatically)

4. **Deploy**
   - Push to `main` branch
   - GitHub Actions workflow runs automatically
   - Deployment proceeds to Azure App Service

The workflow is defined in `.github/workflows/azure-deploy.yml` and:
- Checks out the code
- Installs dependencies
- Builds the TypeScript
- Deploys using the publish profile

### Verify Deployment

After deployment, you can:
- Check the App Service activity log in Azure portal
- Review GitHub Actions workflow run logs on GitHub
- Test the server by connecting via MCP client pointing to the deployed instance

## Logging

**Important:** The MCP server uses stdio for communication, so logging is restricted:
- ✅ Use `console.error()` for logging (writes to stderr, safe for STDIO-based MCP)
- ❌ Never use `console.log()` (writes to stdout, corrupts MCP JSON-RPC messages)

For production, consider:
- Redirecting logs to Application Insights via Azure SDK
- Using structured logging libraries that write to stderr
- Checking Azure App Service logs in the Azure portal

## Troubleshooting

### "Cannot find module '@modelcontextprotocol/sdk'"
- Run `npm install` to ensure all dependencies are installed
- Check that `@modelcontextprotocol/sdk` is in `package.json` dependencies

### Build errors (TypeScript)
- Ensure Node.js >= 16 is installed
- Delete `build/` and `node_modules/` and reinstall: `npm install && npm run build`

### Tests failing
- Ensure `.env` file exists (even if empty) or set env vars in your shell before running tests
- Check that nock mocks match your actual SevenRooms API requests

### Server not connecting as MCP client
- Ensure the server runs without throwing errors: `npm start` (should print to stderr)
- Verify the MCP client is correctly configured to call the server

## Contributing

1. Make changes to `src/index.ts`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Commit and push to trigger CI/CD

## License

MIT

## References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK for Node.js](https://github.com/modelcontextprotocol/typescript-sdk)
- [SevenRooms API Documentation](https://sevenrooms.com/developers)
