import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Removed unused import (makeReservation) to avoid potential TS unused variable errors.
import { getAllRestaurants, getRestaurant } from "../lib/restaurants.js";
import { getAuthToken } from "../lib/getAuthToken.js";
import { SEVENROOMS_BASE } from "../lib/env.js";

// Shared runtime schema for tool parameters
const MakeReservationsInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,{ message: "Date must be in YYYY-MM-DD format" })
    .describe("Reservation date (YYYY-MM-DD)"),
  time: z
    .string()
    .regex(/^\d{1,2}:\d{2}\s?(AM|PM|am|pm)$/,{ message: "Time must be in HH:MM AM/PM format (e.g., 7:30 PM)" })
    .describe("Reservation time (HH:MM AM/PM)"),
  party_size: z
    .number()
    .int({ message: "Party size must be an integer" })
    .min(1, { message: "Party size must be at least 1" })
    .max(8, { message: "Party size must be at most 20" })
    .describe("Number of guests"),
  first_name: z
    .string()
    .min(1, { message: "First name cannot be empty" })
    .describe("Guest first name"),
  last_name: z
    .string()
    .min(1, { message: "Last name cannot be empty" })
    .describe("Guest last name"),
  email: z
    .string()
    .email({ message: "Must be a valid email address" })
    .describe("Guest email"),
  phone: z
    .string()
    .regex(/^\+?[0-9\- ]{7,15}$/,{ message: "Phone must be 7-15 digits (allow +, space, -)" })
    .describe("Guest phone number"),
  restaurant: z
    .string()
    .min(1, { message: "Restaurant name cannot be empty" })
    .describe("Restaurant Name"),
  playerId: z
    .string()
    .optional()
    .describe("Optional player ID"),
});

// Optional full Zod schema (can be used elsewhere if needed)
type MakeReservationsInput = z.infer<typeof MakeReservationsInputSchema>;


/**
 * Registers the make_reservations tool on the provided MCP server instance.
 */
export function registerMakeReservationsTool(server: McpServer) {
  server.tool(
    "make_reservations",
    "Make a restaurant reservation with SevenRooms",
  // Pass the Zod raw shape; server.tool overload expects a ZodRawShape not a ZodObject.
  MakeReservationsInputSchema.shape,
    async (input: MakeReservationsInput) => {

      try {
        
        const token = await getAuthToken();
        const venueId = (await getRestaurant(input.restaurant as string))?.venueId;
        
        if(!venueId){
          const restaurants = (await getAllRestaurants()).join("\n ");
            return {
                content: [
                    {
                        type: "text",
                        text: `${input.restaurant} not found in system. Here is the restaurant list. error${restaurants}`,
                    }
                ],
            };
        }

        // Validate all inputs explicitly so all fields are required & errors reported.
        const parsed = MakeReservationsInputSchema.safeParse(input);
        if(!parsed.success){
          const issues = parsed.error.errors
            .map(e => `${e.path.join('.') || 'root'}: ${e.message}`)
            .join('\n');
          return {
            content: [
              { type: 'text', text: `Validation failed:\n${issues}` }
            ]
          };
        }
        const { time, party_size, first_name, last_name, email, phone, date, restaurant } = parsed.data;

        const payload = {
          date,
          time,
          party_size, // number will be stringified when building URLSearchParams
          first_name,
          last_name,
          email,
          phone,
          restaurant,
          source: 'copilot-agent',
          loyalty_id: input.playerId
        } as const;

        // Convert payload to x-www-form-urlencoded
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
          if (value !== undefined && value !== null) {
            // Ensure value is appended as a string to satisfy URLSearchParams type requirements.
            params.append(key, String(value));
          }
        }

        const url = `${SEVENROOMS_BASE}/venues/${venueId}/book`;

        const sr = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: params.toString()
        });

        const result = await sr.json();

        if (!sr.ok) {
            return {
                content: [
                    {
                        type: "text",
                        text: `error making reservation: ${result.message || 'Unknown error'}`,
                    },
                ],
            };
        }

        const confirmation_number = result?.data?.reservation_reference_code;

        return {
          content: [
            { type: "text", text: `Reservation successful. Your confirmation number: ${confirmation_number}` },
          ],
        };
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Failed to make reservation: ${errorMessage}` },
          ],
        };
      }
    }
  );
}
