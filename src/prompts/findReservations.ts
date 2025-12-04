import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the find reservations prompt
 */
export function registerFindReservationsPrompt(server: McpServer) {
  server.prompt(
    "find_reservations",
    "Help users locate their existing reservations",
    {
      search_type: z.enum(["confirmation", "date", "email"]).optional().describe("Type of search")
    },
    async ({ search_type }) => {
      let searchGuidance = "I can help you find your reservation using:\n- Confirmation number\n- Date of reservation\n- Email address\n- Phone number\n- Your name";
      
      if (search_type === "confirmation") {
        searchGuidance = "Please provide your confirmation number.";
      } else if (search_type === "date") {
        searchGuidance = "Please provide the date of your reservation (YYYY-MM-DD format).";
      } else if (search_type === "email") {
        searchGuidance = "Please provide the email address used for the reservation.";
      }
      
      return {
        description: "Reservation lookup assistant",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "I need to find my reservation."
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: searchGuidance
            }
          }
        ]
      };
    }
  );
}
