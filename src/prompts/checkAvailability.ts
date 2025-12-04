import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the check availability prompt
 */
export function registerCheckAvailabilityPrompt(server: McpServer) {
  server.prompt(
    "check_availability",
    "Check available time slots at a restaurant",
    {
      restaurant: z.string().describe("Restaurant name"),
      date: z.string().optional().describe("Preferred date (YYYY-MM-DD)"),
      time: z.string().optional().describe("Preferred time (HH:MM AM/PM)")
    },
    async ({ restaurant, date, time }) => {
      return {
        description: "Availability checker",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `What times are available at ${restaurant}${date ? ` on ${date}` : ''}${time ? ` around ${time}` : ''}?`
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `I'll check availability at ${restaurant} for you. I need:\n\n${!date ? '1. **Date**: Which day would you like to dine? (YYYY-MM-DD)\n' : ''}${!time ? `${!date ? '2' : '1'}. **Time**: What time are you thinking? (e.g., 7:00 PM)\n` : ''}${!date || !time ? `${!date && !time ? '3' : '2'}. **Party Size**: How many guests?\n` : '1. **Party Size**: How many guests?\n'}\nOnce I have these details, I'll show you available time slots.`
            }
          }
        ]
      };
    }
  );
}
