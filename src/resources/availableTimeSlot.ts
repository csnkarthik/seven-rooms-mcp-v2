import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAuthToken } from "../lib/getAuthToken.js";
import {SEVENROOMS_BASE} from "../lib/env.js"
import {getRestaurant} from "../lib/restaurants.js"
/**
 * Registers the available_time_slot resource.
 * URI format: available://YYYY-MM-DD/HH:MM/party_size
 */
export function registerAvailableTimeSlotResource(server: McpServer) {
  server.resource(
    "available_time_slot",
    // Simplified template; removed extraneous options object that could interfere with listing
    new ResourceTemplate("reservation://{restaurant}/{date}/{time}/{party}", {
      // Minimal list callback returning no concrete instances yet; template should still be advertised
      list: async () => ({ resources: [] })
    }),
    {
      description: "Get available time slots for a restaurant, date, time and party size",
      title: "Available Time Slots",
      mimeType: "application/json",
    },
    async (uri, { restaurant, date, time, party }) => {

      try {

        const uriStr = uri.toString();

        // Compute endTime = start time + 2 hours (wrap 24h)
        const restaurantStr = ensureString(getRestaurant(restaurant as string));
        const dateStr = ensureString(date);
        const timeStr = ensureString(time);
        const partyStr = ensureString(party);

        const endTime = addHours(timeStr, 2);
        const token = await getAuthToken();

        // Build URL safely with encoding
        const params = new URLSearchParams({
          date: dateStr,
          party_size: partyStr,
          start_time: timeStr,
          end_time: endTime,
        });
        const url = `${SEVENROOMS_BASE}/venues/${encodeURIComponent(restaurantStr)}/availability?${params.toString()}`;

        const sr = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!sr.ok) {
          const text = await sr.text();
          return {
            contents: [
              {
                uri: uriStr,
                mimeType: "application/json",
                text: JSON.stringify({
                  error: `SevenRooms availability failed (${sr.status}) ${text}`,
                }),
              },
            ],
          };
        }

        const result = await sr.json();
        // Use stderr for debug logs only if needed
        if (process.env.DEBUG?.toLowerCase() === "true") {
          console.error("[debug] availability response", JSON.stringify(result).slice(0, 2000));
        }

        const rawSlots = extractBookableTimes(result);

        // Deduplicate & chronological sort
        const slots = Array.from(new Set(rawSlots)).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

        if (slots.length === 0) {
          return {
            contents: [{
              uri: uriStr,
              mimeType: "application/json",
              text: JSON.stringify({ message: "No available time slots found" }),
            }]
          };
        }

        return {
          contents: [
            {
              uri: uriStr,
              mimeType: "application/json",
              text: JSON.stringify({ available_times: slots }),
            },
          ],
        };
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify({
                error: `Failed to retrieve availability: ${errorMessage}`,
              }),
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
