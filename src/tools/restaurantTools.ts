// Tool registration 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerMakeReservationsTool } from "./makeReservation.js"
import { registerFindAvailableTimeTool } from "./findAvailableTime.js";
import { registerListRestaurantsTool } from "./listRestaurants.js";
import { registerFindMyReservationTool } from "./findMyReservation.js";
import { registerCancelMyReservationTool } from "./cancelReservation.js";


export function registerRestaurantTools(server: McpServer) {
 registerMakeReservationsTool(server);
 registerCancelMyReservationTool(server);
 registerFindAvailableTimeTool(server)
 registerListRestaurantsTool(server)
 registerFindMyReservationTool(server)
  
}
