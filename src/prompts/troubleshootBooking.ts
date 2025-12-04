import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the troubleshoot booking prompt
 */
export function registerTroubleshootBookingPrompt(server: McpServer) {
  server.prompt(
    "troubleshoot_booking",
    "Help users resolve booking issues",
    {
      issue_type: z.enum(["no_availability", "error", "modification", "special_request"]).optional()
    },
    async ({ issue_type }) => {
      let guidance = "I can help with:\n- No available times\n- Booking errors\n- Modifying reservations\n- Special requests or accommodations";
      
      if (issue_type === "no_availability") {
        guidance = "If your preferred time isn't available, I can:\n1. Check nearby time slots\n2. Suggest alternative dates\n3. Check other restaurants with similar cuisine";
      } else if (issue_type === "error") {
        guidance = "I'll help resolve any booking errors. Please describe what happened.";
      } else if (issue_type === "modification") {
        guidance = "To modify your reservation, I'll need your confirmation number. What would you like to change?";
      } else if (issue_type === "special_request") {
        guidance = "Please describe your special request (dietary restrictions, accessibility needs, etc.)";
      }
      
      return {
        description: "Booking troubleshooting assistant",
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: guidance
            }
          }
        ]
      };
    }
  );
}
