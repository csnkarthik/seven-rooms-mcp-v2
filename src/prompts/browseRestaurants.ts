import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the browse restaurants prompt
 */
export function registerBrowseRestaurantsPrompt(server: McpServer) {
  server.prompt(
    "browse_restaurants",
    "Help users discover available restaurants",
    {},
    async () => {
      return {
        description: "Restaurant discovery assistant",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "What restaurants are available?"
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: "Here are the available restaurants:\n\n**Casa Playa** 🌮\nCuisine: Mexican Coastal\nLocation: Downtown\nPrice Range: $$-$$$\nAvailable: Lunch & Dinner\n\n**The Garden Bistro** 🥗\nCuisine: Contemporary American\nLocation: Midtown\nPrice Range: $$\nAvailable: Brunch, Lunch & Dinner\n\n**Sakura Sushi** 🍱\nCuisine: Japanese\nLocation: Uptown\nPrice Range: $$$\nAvailable: Dinner only\n\n**Bella Italia** 🍝\nCuisine: Italian\nLocation: West End\nPrice Range: $$-$$$\nAvailable: Lunch & Dinner\n\nWhich restaurant interests you? I can help you check availability and make a reservation!"
            }
          }
        ]
      };
    }
  );
}
