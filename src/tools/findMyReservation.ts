import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllRestaurants, getRestaurant } from "../lib/restaurants.js";
import { getAuthToken } from "../lib/getAuthToken.js";
import { requireAppConfig } from "../lib/env.js";
import { date, email } from "zod/v4";
import { findReservation } from "../lib/findReservation.js";


// Shared runtime schema for tool parameters
const FindMyReservationInputSchema = z.object({
    confirmation_number: z.string().describe("Confirmation Number"),
    // date: z.string().describe("Reservation date (YYYY-MM-DD)"),
    // fullName: z.string().describe("Full Name used for the reservation"),
    // email: z.string().email().describe("Email used for the reservation"),
    // phone: z.string().describe("Phone number used for the reservation")
});

// Optional full Zod schema (can be used elsewhere if needed)
type FindMyReservationInput = z.infer<typeof FindMyReservationInputSchema>;

/**
 * Registers the make_reservations tool on the provided MCP server instance.
 */
// Registers the find_available_time tool on the provided MCP server instance.
// (Function name retained to avoid breaking existing imports; consider renaming to registerFindAvailableTimeTool.)
export function registerFindMyReservationTool(server: McpServer) {
    server.tool(
        "find_my_reservation",
        "Find users reservation by confirmation number or by either date or fullName or  email or phone",
        
    FindMyReservationInputSchema.shape,
    async (input: FindMyReservationInput) => {

            const { sevenRoomBaseUrl: SEVENROOMS_BASE } = requireAppConfig();

            try {

                const token = await getAuthToken();

                const reservation  = await findReservation(input.confirmation_number)
                
                //console.error('reserversion_id found:', reservation_id);
                if (!reservation) {
                    throw new Error(`Reservation with confirmation number ${input.confirmation_number} not found.`);
                }

                return {
                    content: [
                        {
                            type: "text",                            
                            text: `Your Reservations: ${reservation.date} at ${reservation.time} for ${reservation.guests} guests. Reservation under ${reservation.firstName} ${reservation.lastName}.`,
                        },
                    ],
                };
                // .

            } catch (error: any) {
                console.error('url', error)
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Unknown error occured: ${errorMessage}`,
                        },
                    ],
                };
            }
        }
    );
}


// Helper: add hours to HH:MM (24h wrap)
function addHours(time: string, hours: number): string {
    const [hStr, mStr] = time.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    h = (h + hours) % 24;
    return `${pad2(h)}:${pad2(m)}`;
}

function pad2(n: number): string { return n < 10 ? `0${n}` : String(n); }

// Convert HH:MM to minutes since midnight for sorting
function timeToMinutes(t: string): number {
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    return (Number.isNaN(h) || Number.isNaN(m)) ? Number.MAX_SAFE_INTEGER : h * 60 + m;
}

// Extract times with type==='book'
function extractBookableTimes(response: any): string[] {
    const availability = Array.isArray(response?.data?.availability) ? response.data.availability : [];
    const times: string[] = [];
    for (const item of availability) {
        const arr = Array.isArray(item?.times) ? item.times : [];
        for (const t of arr) {
            if (t && t.type === 'book' && typeof t.time === 'string') {
                times.push(normalizeTime(t.time));
            }
        }
    }
    return times;
}

// Normalize times to HH:MM (pad hours)
function normalizeTime(t: string): string {
    const match = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return t;
    const h = pad2(parseInt(match[1], 10));
    return `${h}:${match[2]}`;
}

// Ensure variable captured from template is a single string (take first element if array)
function ensureString(v: unknown): string {
    if (Array.isArray(v)) return String(v[0] ?? "");
    return String(v ?? "");
}
