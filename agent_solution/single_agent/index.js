import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";
import { PriorityQueue } from "@datastructures-js/priority-queue";
import { IntentionRevision, IntentionRevisionRevise, Intention, Plan, GoPickUp, BlindMove, PddlMove } from "./classes.js"


// DECLARATIONS AND INITIALIZATIONS

const client = new DeliverooApi(
    "http://localhost:8080/",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcxZjY0NjU0NjE3IiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTY5ODc0NzUzNH0.V9bT6YrrS37wODxh1mP34Ezu6eXNdfEMnaGmjfzxyaI"
)
const me = {};
const myBeliefset = new Beliefset();
const db_delivery = new Map()
const db_parcels = new Map()

// FUNCTIONS AND CALLBACKS

client.onYou(({ id, name, x, y, score }) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
    me.expected_score = score //TODO
})

// print whenever client do a request
client.onYou(async (info) => {
    if (info.x % 1 != 0 || info.y % 1 != 0) return;
    console.log("You", info);
});

client.onMap((w, h, tiles) => {
    for (let { x, y, delivery } of tiles) {
        myBeliefset.declare('tile ' + x + '_' + y);
        if (delivery)
            myBeliefset.declare('delivery ' + x + '_' + y);
        let right = tiles.find((_x, _y) => x == _x + 1 && y == _y);
        if (right)
            myBeliefset.declare('right ' + x + '_' + y + ' ' + right.x + '_' + right.y + ' ')

    }
})

function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}


// si attiva quando appare una nuova parcel nel campo visivo, sia quando ci muoviamo che quando spawna di fianco
client.socket.on("parcels sensing", (parcels) => {
    const actions = [] //vorrei fare che le options venissero memorizzate sempre nell'agent, non solo quando si attiva la funzione
    let best_option = null;
    let nearest = Number.MAX_VALUE;

    for (const p of parcels) {
        if (p.carriedBy != null) continue;

        // tutto quello che segue sono parcel che non sono portate da nessuno
        const info = {
            x: p.x, y: p.y, reward: p.reward, distance: distance({ x: p.x, y: p.y }, me),

        }
        db_parcels.set(p.id, info)
        actions.push(['go_pick_up', p.x, p.y, p.id]);

        console.log("Parcel " + p.id + " with reward " + p.reward + " is at " + p.x + " " + p.y + " and is carried by " + p.carriedBy)
    }


    for (const option of actions) {
        if (option[0] == 'go_pick_up') {
            let [go_pick_up, x, y, id] = option;
            let current_d = distance({ x, y }, me)
            if (current_d < nearest) {
                best_option = option
                nearest = current_d
                console.log("Best option is " + best_option + " with distance " + nearest)
            }
        }
    }

    if (best_option) // Best option is selected
        myAgent.push(best_option)
})

// DA USARE COME SPUNTO PER FARE IntentionRevisionRevise

// class IntentionRevisionReplace extends IntentionRevision {
//     async push (predicate) {
//         // Check if already queued
//         const last = this.intention_queue.at( this.intention_queue.length - 1 );

//         if ( last && last.predicate.join(' ') == predicate.join(' ') )
//             return; // intention is already being achieved        

//         console.log( 'IntentionRevisionReplace.push', predicate );
//         const intention = new Intention( this, predicate );
//         this.intention_queue.push( intention );

//         if (last)
//             last.stop();
//     }
// }

const myAgent = new IntentionRevisionRevise();
myAgent.loop();

const planLibrary = [];

planLibrary.push(GoPickUp)
planLibrary.push(BlindMove)
planLibrary.push(PddlMove)