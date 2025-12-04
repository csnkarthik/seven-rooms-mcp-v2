import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { requireAppConfig } from "../lib/env.js";
import { getAuthToken } from "../lib/getAuthToken.js";
import { findReservation } from "../lib/findReservation.js";

// Shared runtime schema for tool parameters
const CancelMyReservationInputSchema = z.object({
  confirmation_number: z
                      .string()
                      .min(1, { message: "confirmation number  cannot be empty" })
                      .describe("Reservation number to cancel"),
});

// Optional full Zod schema (can be used elsewhere if needed)
type CancelMyReservationInput = z.infer<typeof CancelMyReservationInputSchema>;
/**
 * Registers the cancel_my_reservation tool on the provided MCP server instance.
 */
export function registerCancelMyReservationTool(server: McpServer) {
  server.tool(
    "cancel_my_reservation",
    "Cancel a restaurant reservation for the provided reservation number",
    CancelMyReservationInputSchema.shape,
    async (input: CancelMyReservationInput) => {
      try {

        const confirmation_number = input.confirmation_number;
        const { sevenRoomBaseUrl: SEVENROOMS_BASE } = requireAppConfig();

        const token = await getAuthToken();

        const reservation_id  = (await findReservation(confirmation_number))?.reservation_id;

        //console.error('reserversion_id found:', reservation_id);
        if (!reservation_id) {
          throw new Error(`Reservation with confirmation number ${confirmation_number} not found.`);
        }

        const url = `${SEVENROOMS_BASE}/reservations/${reservation_id}/cancel`;

        console.error('url:', url);

         const sr = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }          
        });

        if (!sr.ok) {
          console.error('cancel_my_reservation:', sr.statusText)

          throw new Error(sr.statusText || `Failed to cancel reservation ${confirmation_number}`);
        }

        const resultText = `Cancelled reservation ${confirmation_number} successfully.`;

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
                type: "text",
                text: `Failed to cancel reservation ${input.confirmation_number}: ${errorMessage}`,
            },
          ],
        };
      } 
    }
  );
}