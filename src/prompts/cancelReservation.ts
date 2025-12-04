import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the cancel reservation prompt
 */
export function registerCancelReservationPrompt(server: McpServer) {
  server.prompt(
    "cancel_reservation",
    "Guide users through canceling a reservation",
    {
      confirmation_number: z.string().optional().describe("Confirmation number")
    },
    async ({ confirmation_number }) => {
      return {
        description: "Reservation cancellation assistant",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I need to cancel my reservation${confirmation_number ? ` (${confirmation_number})` : ''}.`
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `I can help you cancel your reservation. ${!confirmation_number ? 'Please provide your confirmation number, and ' : ''}I'll process the cancellation for you.\n\n**Note**: Please review the restaurant's cancellation policy for any applicable fees or deadlines.`
            }
          }
        ]
      };
    }
  );
}
