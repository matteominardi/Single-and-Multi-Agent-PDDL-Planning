import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";
import { IntentionRevision, IntentionRevisionRevise, Intention, Plan, GoPickUp, BlindMove, PddlMove } from "./classes.js"
import depth_search_daemon from "./depth_search_daemon.js";

const client = new DeliverooApi(
    "http://localhost:8080/",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcxZjY0NjU0NjE3IiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTY5ODc0NzUzNH0.V9bT6YrrS37wODxh1mP34Ezu6eXNdfEMnaGmjfzxyaI"
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

client.onMap((w, h, tiles) => {
    for (let tile of tiles) {
        myBeliefset.declare("tile " + tile.x + "_" + tile.y);
        myBeliefset.declare("available " + tile.x + "_" + tile.y);

        if (tile.delivery) {
            myBeliefset.declare("delivery " + tile.x + "_" + tile.y);
        }

        let right = tiles.find((_x, _y) => tile.x + 1== _x && tile.y == _y);
        let left = tiles.find((_x, _y) => tile.x - 1 == _x && tile.y == _y);
        let up = tiles.find((_x, _y) => tile.x == _x && tile.y + 1 == _y);
        let down = tiles.find((_x, _y) => tile.x == _x && tile.y - 1 == _y);
        if (right)
            myBeliefset.declare("right " + x + "_" + y + " " + right.x + "_"  + right.y);
        if (left)
            myBeliefset.declare("left " + x + '_' + y + " " + left.x + "_" + left.y);
        if (up)
            myBeliefset.declare("up " + x + "_"  + y + " " + up.x + "_" + up.y);
        if (down)
            myBeliefset.declare("down " + x + "_" + y + " " + down.x + "_" + down.y);
    }
});

client.onParcelsSensing((parcels) => {
    if (me.x % 1 != 0 || me.y % 1 != 0) return;

    // p = { id:string, x:number, y:number, carriedBy:string, reward:number }
    for (const p of parcels) { 
        
        if (p.carriedBy != null) {
            myBeliefset.declare("carries " + p.carriedBy + " " + p.id)
            
            if (db_parcels.has(p.id)) 
                db_parcels.delete(p.id);
        
        } else {
            myBeliefset.declare("parcel " + p.id);
            myBeliefset.declare("at " + p.id + " " + p.x + "_" + p.y);

            let dist = Infinity;
            if (me) {
                dist = distance({ x: p.x, y: p.y }, { x: me.x, y: me.y });
            }
            
            if (db_parcels.has(p.id)) {
                let p_history = db_parcels.get(p.id);
                
                if (p_history.reward != p.reward || p_history.distance != dist) 
                    db_parcels.set(p.id, {x: p.x, y: p.y, reward: p.reward, distance: dist, gain: p.reward - dist});
                
            } else {
                db_parcels.set(p.id, {x: p.x, y: p.y, reward: p.reward, distance: dist, gain: p.reward - dist});
            }
        }
    }

    let options = [];
    
    for (const [id, parcel] of db_parcels.entries()) {
        if (!parcel.carriedBy) {
            let nearest_delivery = nearestDelivery({x: parcel.x, y: parcel.y});
            options.push({
                instruction: "go_pick_up", 
                x: parcel.x, 
                y: parcel.y, 
                gain: me.carrying + parcel.reward - (me.carrying_size + 1) * PARCEL_DECADING_INTERVAL/MOVEMENT_DURATION * (distance({x: me.x, y: me.y}, {x: parcel.x, y: parcel.y}) + distance({x: parcel.x, y: parcel.y}, {x: nearest_delivery.x, y: nearest_delivery.y}))
            })
        }
    }
    if (me.carrying > 0) {
        let nearest_delivery = nearestDelivery(me);
        options.push({
            instruction: "go_deliver", 
            x: nearest_delivery.x,
            y: nearest_delivery.y,
            gain: me.carrying - me.carrying_size * PARCEL_DECADING_INTERVAL/MOVEMENT_DURATION * distance({x: me.x, y: me.y}, {x: nearest_delivery.x, y: nearest_delivery.y})
        })
    }

    options.sort((o1, o2) => - o1.gain + o2.gain);
    for (const option of options) 
        myAgent.push(option);
})

client.onAgentsSensing((agents) => {
    if (me.x % 1 != 0 || me.y % 1 != 0) return;
    
    // a = { id:string, name:string, x:number, y:number, score:number }
    for (const a of agents) {
        if (a.x % 1 != 0 || a.y % 1 != 0) continue; 

        myBeliefset.declare("opponent " + a.id);

        if (!db_agents.has(a.id)) {
            db_agents.set(a.id, a)
            myBeliefset.declare("at " + a.id + " " + a.x + "_" + a.y);
            myBeliefset.undeclare("available " + a.x + "_" + a.y);
        } else {
            const a_history = db_agents.get(a.id)

            if (a_history.x != a.x || a_history.y != a.y) {
                db_agents.delete(a_history.id);
                db_agents.set(a.id, a)
                myBeliefset.undeclare("at " + a_history.id + " " + a_history.x + "_" + a_history.y);
                myBeliefset.declare("at " + a.id + " " + a.x + "_" + a.y);
                myBeliefset.declare("available " + a_history.x + "_" + a_history.y);
                myBeliefset.undeclare("available " + a.x + "_" + a.y);
            }
        }
    }

    for (const [id, history] of db_agents.entries()) {
        if (!agents.map(a => a.id).includes(id)) {
            // TODO: decidere cosa vogliamo fare con gli agenti che abbiamo già visto ma 
            // non sono più nel nostro campo visivo
            // per ora li dimentica e assume che la loro posizione sia liberata
            db_agents.delete(id);
            myBeliefset.undeclare("at " + history.id + " " + history.x + "_" + history.y);
            myBeliefset.declare("available " + history.x + "_" + history.y);
        } 
    }
})

const myAgent = new IntentionRevisionRevise();
myAgent.loop();

export { me, client, map, distance , nearestDelivery};
