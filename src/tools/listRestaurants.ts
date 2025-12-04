import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllRestaurants } from "../lib/restaurants.js";

/**
 * Registers the make_reservations tool on the provided MCP server instance.
 */
export function registerListRestaurantsTool(server: McpServer) {
  server.tool(
    "list_reservation",
    "list all the restaurants available in the system",
    async () => {
     
      try {

        const restarants = (await getAllRestaurants())?.map(r => r.venueName).join("\n ");
        return {
          content: [
            {
              type: "text",
              text: `Restaurants at Wynn and Encore Las vegas:\n ${restarants}`,
            },
          ],
        };
      } catch (error: any) {

        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error("Error listing restaurants:", errorMessage);

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
        };
      }
    }
  );
}
