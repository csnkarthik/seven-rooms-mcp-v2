import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllRestaurants, getRestaurant } from "../lib/restaurants.js";
import { getAuthToken } from "../lib/getAuthToken.js";
import { requireAppConfig } from "../lib/env.js";


// Shared runtime schema for tool parameters
const AvailabilityInputSchema = z.object({
    restaurant: z.string().describe("Restaurant Name"),
    date: z.string().describe("Reservation date (YYYY-MM-DD)"),
    time: z.string().describe("Reservation time (HH:MM AM/PM)"),
    party_size: z.number().describe("Number of guests")

});

// Optional full Zod schema (can be used elsewhere if needed)
type AvailabilityInput = z.infer<typeof AvailabilityInputSchema>;

/**
 * Registers the make_reservations tool on the provided MCP server instance.
 */
// Registers the find_available_time tool on the provided MCP server instance.
// (Function name retained to avoid breaking existing imports; consider renaming to registerFindAvailableTimeTool.)
export function registerFindAvailableTimeTool(server: McpServer) {
    server.tool(
        "find_available_time",
        "Find available time slots for a restaurant by date, time and party size",
        
    AvailabilityInputSchema.shape,
    async (input: AvailabilityInput) => {

            const { sevenRoomBaseUrl: SEVENROOMS_BASE } = requireAppConfig();

            try {

                const venueId = (await getRestaurant(input.restaurant as string))?.venueId;

                if(!venueId){
                    const restaurants = (await getAllRestaurants()).map(r => r.venueName).join("\n ");
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${input.restaurant} not found in system. Here is the restaurant list. ${restaurants}`,
                            }
                        ],
                    };
                }
                
                const dateStr = ensureString(input.date);
                const timeStr = ensureString(input.time);
                const partyStr = ensureString(input.party_size);
                // Compute endTime = start time + 2 hours (wrap 24h)
                const endTime = addHours(timeStr, 2);
                const token = await getAuthToken();

                // Build URL safely with encoding
                const params = new URLSearchParams({
                    date: dateStr,
                    party_size: partyStr,
                    start_time: timeStr,
                    end_time: endTime,
                });
                const url = `${SEVENROOMS_BASE}/venues/${venueId}/availability?${params.toString()}`;

                console.error('url', url)

                const sr = await fetch(url, {
                    headers: { Authorization: `${token}` },
                });

                if (!sr.ok) {
                    const text = await sr.text();
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error fetching availability (HTTP ${sr.status}): ${text || 'No body'}`
                            },
                        ],
                    };
                }

                const result = await sr.json();
                const rawSlots = extractBookableTimes(result);

                // Deduplicate & chronological sort
                const slots = Array.from(new Set(rawSlots)).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

                if (slots.length === 0) {
                    return {
                        content: [{
                            type: "text",
                            text: `No available time slots for ${input.restaurant} on ${input.date} at ${input.time} for party size ${input.party_size}.`,
                        }]
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `Available time slots for ${input.restaurant} on ${input.date} (party size ${input.party_size}):\n${slots.join("\n")}`,
                        },
                    ],
                };

            } catch (error: any) {
                console.error('url', error)
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to retrieve availability: ${errorMessage}`,
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
