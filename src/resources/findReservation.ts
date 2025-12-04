import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios from "axios";

/**
 * Registers the available_time_slot resource.
 * URI format: available://YYYY-MM-DD/HH:MM/party_size
 */
export function registerFindRerservationResource(server: McpServer) {
  server.resource(
    "find_reservation",
    new ResourceTemplate("reservation://find-reservation/{reservation_id}", { list: undefined }),
    { description: "Find reservation by confirmation id" },
    async (uri: URL) => {
      try {
        const SEVENROOMS_API_KEY = process.env.SEVENROOMS_API_KEY;
        const SEVENROOMS_API_URL = process.env.SEVENROOMS_API_URL;
        const uriStr = uri.toString();
        const match = uriStr.match(/^available:\/\/([^/]+)\/([^/]+)\/(\d+)$/);
        if (!match) {
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: "application/json",
                text: JSON.stringify({
                  error: "Invalid URI format. Expected: available://YYYY-MM-DD/HH:MM/party_size",
                }),
              },
            ],
          };
        }

        const [, date, time, party_size] = match;

        if (!SEVENROOMS_API_KEY || !SEVENROOMS_API_URL) {
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: "application/json",
                text: JSON.stringify({
                  error: "SevenRooms API credentials are not configured",
                }),
              },
            ],
          };
        }

        const url = `${SEVENROOMS_API_URL.replace(/\/$/, "")}/availability`;
        const response = await axios.get(url, {
          params: { date, time, party_size },
          headers: { Authorization: `Bearer ${SEVENROOMS_API_KEY}` },
          timeout: 10000,
        });

        const data = response.data || {};
        const times = data.times || data.available_times || data.available || [];

        const result: string[] = [];
        for (const t of times) {
          if (!t) continue;
          if (typeof t === "string") {
            result.push(t);
            continue;
          }
          if (t.type === "book" && (t.time || t.start_time || t.datetime)) {
            result.push(t.time || t.start_time || t.datetime);
          }
        }
        const unique = Array.from(new Set(result));

        return {
          contents: [
            {
              uri: uriStr,
              mimeType: "application/json",
              text: JSON.stringify({ available_times: unique }),
            },
          ],
        };
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify({
                error: `Failed to retrieve availability: ${errorMessage}`,
              }),
            },
          ],
        };
      }
    }
  );
}
