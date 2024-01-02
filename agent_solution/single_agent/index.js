import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";
import { IntentionRevision, IntentionRevisionRevise, Intention, Plan, GoPickUp, BlindMove, PddlMove } from "./classes.js"
import depth_search_daemon from "./depth_search_daemon.js";
import {initMap, updateAgents, updateParcels} from "./callbacks.js";

const client = new DeliverooApi(
    "http://localhost:8080/",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUxOTZiYjQzMTcyIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTcwNDEyMDMyN30.3AlvP4JKLYZxshw_p0Du0IHddBnZjELpOp-C4qBi0nw"
)

const me = {carrying : 0, carrying_size: 0};
const myBeliefset = new Beliefset();
const db_parcels = new Map()
const db_agents = new Map()

function distance_manhattan({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}

const depth_search = depth_search_daemon(client);
function distance_depth_search( {x:x1, y:y1}, {x:x2, y:y2} ) {
    return depth_search( {x:x1, y:y1}, {x:x2, y:y2} ).length;
}

function distance({x:x1, y:y1}, {x:x2, y:y2}) {
    return distance_manhattan({x:x1, y:y1}, {x:x2, y:y2});
}

const map = new Map()
client.onTile( ( x, y, delivery ) => {
    if ( ! map.has(x) )
        map.set(x, new Map())    
    map.get(x).set(y, {x, y, delivery})
} );
client.onNotTile( ( x, y ) => {
    if ( ! map.has(x) )
        map.set(x, new Map())    
    map.get(x).set(y, {x, y, blocked: true})
} );

function nearestDelivery({x, y}) {
    let deliveryCells = [];
    map.forEach((heightMap) => {
        heightMap.forEach((cell) => {
            if (cell.delivery) {
                deliveryCells.push(cell);
            }
        });
    });

    deliveryCells.sort((a, b) => {
        return distance({x, y}, {x: a.x, y: a.y}) - distance({x, y}, {x: b.x, y: b.y});
    });
    
    return deliveryCells[0]
}

var  MOVEMENT_DURATION;
var PARCEL_DECADING_INTERVAL;
client.onConfig( (config) => {
    MOVEMENT_DURATION = config.MOVEMENT_DURATION;
    PARCEL_DECADING_INTERVAL = config.PARCEL_DECADING_INTERVAL == '1s' ? 1000 : 1000000;
} );

client.onYou(async ( {id, name, x, y, score} ) => {
    if (x % 1 != 0 || y % 1 != 0) return;
    me.id = id;
    me.name = name;
    me.x = x;
    me.y = y;
    me.score = score;
});

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou(me => updateMe(me));
client.onTile( ( x, y, delivery ) => console.log(x, y, delivery) );

const myAgent = new IntentionRevisionRevise();
myAgent.loop();

export { me, client, map, distance , nearestDelivery};
