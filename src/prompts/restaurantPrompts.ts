import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReservationAssistantPrompt } from "./reservationAssistant.js";
import { registerFindReservationsPrompt } from "./findReservations.js";
import { registerCheckAvailabilityPrompt } from "./checkAvailability.js";
import { registerCancelReservationPrompt } from "./cancelReservation.js";
import { registerBrowseRestaurantsPrompt } from "./browseRestaurants.js";
import { registerTroubleshootBookingPrompt } from "./troubleshootBooking.js";

/**
 * Registers all restaurant-related prompts for the SevenRooms MCP server
 */
export function registerRestaurantPrompts(server: McpServer) {
  registerReservationAssistantPrompt(server);
  registerFindReservationsPrompt(server);
  registerCheckAvailabilityPrompt(server);
  registerCancelReservationPrompt(server);
  registerBrowseRestaurantsPrompt(server);
  registerTroubleshootBookingPrompt(server);
}
