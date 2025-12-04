import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the reservation assistant prompt
 */
export function registerReservationAssistantPrompt(server: McpServer) {
  server.prompt(
    "reservation_assistant",
    "Guide users through making a restaurant reservation with a conversational approach",
    {
      restaurant: z.string().optional().describe("Restaurant name (optional)"),
      occasion: z.string().optional().describe("Special occasion (optional)")
    },
    async ({ restaurant, occasion }) => {
      const restaurantText = restaurant ? ` at ${restaurant}` : '';
      const occasionText = occasion ? ` for ${occasion}` : '';
      
      return {
        description: "Interactive reservation assistant",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I'd like to make a reservation${restaurantText}${occasionText}.`
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `I'd be happy to help you make a reservation${restaurantText}! To find the perfect table for you, I'll need:\n\n1. **Date**: When would you like to dine? (YYYY-MM-DD format)\n2. **Time**: What time works best? (e.g., 7:00 PM)\n3. **Party Size**: How many guests?\n4. **Contact**: Your email and phone number for confirmation${!restaurant ? '\n5. **Restaurant**: Which restaurant would you prefer?' : ''}\n\nPlease provide these details and I'll check availability.`
            }
          }
        ]
      };
    }
  );
}
