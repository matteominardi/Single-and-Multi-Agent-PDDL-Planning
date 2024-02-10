import aStar from "a-star";
import BeliefSet from "./belief.js";
import Me, { Actions } from "./me.js";

async function mySolver(
    pddlDomain,
    pddlProblem,
    remote_url = "http://localhost:5001",
    planner = "optic",
) {
    // console.log("problem", pddlProblem);
    try {
        // console.log("sending request to planner");
        let ask = await fetch(`${remote_url}/package/${planner}/solve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                persistent: "true",
            },
            body: JSON.stringify({ domain: pddlDomain, problem: pddlProblem }),
        });
        ask = await ask.json();

        let plan = await fetch(`${remote_url}${ask.result}`);
        plan = await plan.json();
        let fail = 0;
        while (plan.status === "PENDING" && fail < 10) {
            await sleep(100);
            fail++;
            plan = await fetch(`${remote_url}${ask.result}`);
            plan = await plan.json();
            // console.log(plan);
        }
        if (fail === 10) {
            console.log("failed to get plan");
            return [[], []];
        }
        plan = await plan.result.output.plan;
        // keep everything after ";;;; Solution Found"
        if (plan.includes(";;;; Solution Found")) {
            plan = await plan.split(";;;; Solution Found")[1];
        } else {
            return [[], []];
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
            const target = tile[3];
            // get number between x and y
            const x = parseInt(target.split("x")[1].split("y")[0]);
            const y = parseInt(target.split("y")[1]);
            return BeliefSet.getMap().getTile(x, y);
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
    const factor =
        0.01 +
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
    const factor =
        0.01 +
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

export {
    computeActions,
    computeDeliveryGain,
    computeParcelGain,
    distanceBetween,
    getPath,
    isEnd,
    mySolver,
    sleep,
};
