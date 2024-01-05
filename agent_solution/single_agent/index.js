import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { Beliefset } from "@unitn-asa/pddl-client";
import { initMap, updateAgents, updateMe, updateParcels } from "./callbacks.js";
import depth_search_daemon from "./depth_search_daemon.js";
import dotenv from "dotenv";
import Me, { Actions } from "../common/me.js";

dotenv.config();

const client = new DeliverooApi(process.env.URL, process.env.TOKEN);

const me = { carrying: 0, carrying_size: 0 };
const myBeliefset = new Beliefset();
const db_parcels = new Map();
const db_agents = new Map();
const map = new Map();

function distance_manhattan({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2));
    const dy = Math.abs(Math.round(y1) - Math.round(y2));
    return dx + dy;
}

const depth_search = depth_search_daemon(client);
function distance_depth_search({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return depth_search({ x: x1, y: y1 }, { x: x2, y: y2 }).length;
}

function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return distance_manhattan({ x: x1, y: y1 }, { x: x2, y: y2 });
}

function nearestDelivery({ x, y }) {
    let deliveryCells = [];
    map.forEach((heightMap) => {
        heightMap.forEach((cell) => {
            if (cell.delivery) {
                deliveryCells.push(cell);
            }
        });
    });

    deliveryCells.sort((a, b) => {
        return (
            distance({ x, y }, { x: a.x, y: a.y }) -
            distance({ x, y }, { x: b.x, y: b.y })
        );
    });

    return deliveryCells[0];
}

var MOVEMENT_DURATION;
var PARCEL_DECADING_INTERVAL;
client.onConfig((config) => {
    MOVEMENT_DURATION = config.MOVEMENT_DURATION;
    PARCEL_DECADING_INTERVAL =
        config.PARCEL_DECADING_INTERVAL == "1s" ? 1000 : 1000000;
});

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));

// setTimeout(() => {
//   Me.do_action(client, Actions.DOWN);
// }, 1000);
//
// setTimeout(() => {
//   Me.do_action(client, Actions.UP);
// }, 2000);

export { client, distance, map, me, nearestDelivery };
