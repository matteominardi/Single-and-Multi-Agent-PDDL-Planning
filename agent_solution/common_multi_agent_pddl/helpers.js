import aStar from "a-star";
import BeliefSet from "./belief.js";
import Me, { Actions } from "./me.js";

async function mySolver(
    pddlDomain,
    pddlProblem,
    remote_url = "http://localhost:5001",
    planner = "/package/dual-bfws-ffparser/solve",
) {
    // console.log("problem", pddlProblem);
    try {
        var res = await fetch( remote_url + planner, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {domain: pddlDomain, problem: pddlProblem} )
        })
        
        if ( res.status != 200 ) {
            throw new Error( `Error at ${remote_url}${planner} ${await res.text()}` );
        }
    
        res = await res.json();
    
        if ( ! res.result ) {
            throw new Error( `No value "result" from ${remote_url+planner} ` + res );
        }
    
        // console.log(res);
    
        // Getting result
        res = await fetch(remote_url+res.result, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {adaptor: "planning_editor_adaptor"} )
        });
    
        if ( res.status != 200 ) {
            throw new Error( `Error at ${remote_url+res.result} ` + await res.text() );
        }
        
        res = await res.json();
    
        // console.log(res);
        // console.log(res.plans[0].result);
        // console.log(res.plans[0].result.plan);
    
        if ( res.status != 'ok' || res.plans[0].status != 'ok' ) {
            throw new Error( `Error at ${remote_url+planner} ` + res );
        }
    
        if ( res.plans[0].result.output.split('\n')[0] != ' --- OK.' ) {
            console.error( 'Plan not found', res.plans[0].result.output );
            return;
        }
    
        console.log( 'Plan found:' )
        plan = await plan.result.output.plan;
        // keep everything after ";;;; Solution Found"
        if (plan.includes(";;;; Solution Found")) {
            plan = await plan.split(";;;; Solution Found")[1];
        } else {
            return [];
        }
        plan = await plan.split("\n");
        // keep only the lines that contains (
        plan = await plan.filter((line) => line.includes("("));
        // keep only the part between parentheses
        plan = await plan.map((line) => {
            const start = line.indexOf("(");
            const end = line.indexOf(")");
            return line.slice(start + 1, end).split(" ");
        });
        // remove move_ prefix
        const actions = await plan.map((line) => line[0].replace("move_", ""));
        const tiles = await plan.map((tile) => {
            const match = tile[tile.length - 1].match(/x(\d)y(\d)/);
            return BeliefSet.getMap().getTile(
                parseInt(match[1]),
                parseInt(match[2]),
            );
        });
        // return path and tiles
        return [actions, tiles];
    } catch (error) {
        console.log(error);
    }
}

function getPath(start) {
    const options = {
        start: start,
        isEnd: isEnd,
        neighbor: getNeighbors,
        distance: distanceBetween,
        heuristic: heuristic,
        hash: hash,
    };
    return aStar(options);
}

function isEnd(tile) {
    const end = BeliefSet.getMap().getTile(Me.requested_x, Me.requested_y);
    return end.equals(tile);
}

function getNeighbors(tile) {
    return BeliefSet.getMap().getNeighbours(tile);
}

function distanceBetween(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function heuristic(tile) {
    return (
        Math.abs(tile.x - Me.requested_x) + Math.abs(tile.y - Me.requested_y)
    );
}

function hash(tile) {
    return tile.x.toString() + "-" + tile.y.toString();
}

function computeActions(path) {
    const actions = [];
    for (let el = 0; el < path.length - 1; el++) {
        const current = path[el];
        const next = path[el + 1];
        if (next.x === current.x) {
            // up
            if (next.y > current.y) actions.push(Actions.UP);
            else actions.push(Actions.DOWN);
        } else {
            if (next.x > current.x) actions.push(Actions.RIGHT);
            else actions.push(Actions.LEFT);
        }
    }
    return actions;
}

function computeParcelGain(parcel) {
    let score = 0;

    const gonnaCarry = BeliefSet.getCarriedByMe().length + 1; // me + parcel
    const factor = 0.01 +
        BeliefSet.getConfig().MOVEMENT_DURATION /
        BeliefSet.getConfig().PARCEL_DECADING_INTERVAL;
    const parcelDistance = distanceBetween(
        BeliefSet.getMe().getMyPosition(),
        BeliefSet.getMap().getTile(parcel.x, parcel.y),
    );
    const closestDeliverySpotDistance = distanceBetween(
        BeliefSet.getMap().getTile(parcel.x, parcel.y),
        BeliefSet.getClosestDeliverySpot(parcel),
    );
    score += BeliefSet.getMyReward(); // me carrying
    score += parcel.reward; // parcel reward
    score -= factor * parcelDistance;
    score -= gonnaCarry * factor * closestDeliverySpotDistance; // me + parcels decading

    return score;
}

function computeDeliveryGain(deliverySpot) {
    let score = 0;

    const gonnaCarry = BeliefSet.getCarriedByMe().length;
    const factor = 0.01 +
        BeliefSet.getConfig().MOVEMENT_DURATION /
        BeliefSet.getConfig().PARCEL_DECADING_INTERVAL;
    const distance = distanceBetween(
        BeliefSet.getMe().getMyPosition(),
        deliverySpot,
    );
    score += BeliefSet.getMyReward(); // me carrying
    score -= gonnaCarry * factor * distance; // me + parcel decading

    return score;
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export { computeActions, computeDeliveryGain, computeParcelGain, distanceBetween, getPath, hash, isEnd, mySolver, sleep };

