import aStar from "a-star";
import BeliefSet from "./belief.js";
import Me, { Actions } from "./me.js";
import { PddlProblem } from "@unitn-asa/pddl-client";
import Communication from "./communication.js";
import Coordinator from "./coordinator.js";
import * as fs from "fs";

async function mySolver(
    pddlDomain,
    pddlProblem,
    remote_url = "http://localhost:5001",
    planner = "optic",
) {
    // console.log("problem", pddlProblem);
    try {
        console.log("sending request to planner");
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
            await sleep(500);
            fail++;
            // console.log("waiting for plan");
            plan = await fetch(`${remote_url}${ask.result}`);
            plan = await plan.json();
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

async function computePath(client, start) {
    let objects = [];
    // get all the tiles
    const mapPddl = Coordinator.getMap().toPddl(); // it is a map of xiyj to array of strings
    // console.log(mapPddl);
    // get all the agents positions that are not in agents
    const agentsPddl = await Communication.Agent.getAgents(client).then(
        // filter agents with name god and me
        (agents) =>
            agents
                .filter(
                    (agent) =>
                        agent.name !== "god" &&
                        agent.name !== BeliefSet.getMe().name,
                )
                .map((agent) => `x${parseInt(agent.x)}y${parseInt(agent.y)}`),
    );

    agentsPddl.forEach(function (key) {
        const infos = mapPddl.get(key);
        // search string that starts with (available and replace it with
        // `(not (available x${i}y${j}))`
        const available = infos.find((info) => info.startsWith("(available"));
        const index = infos.indexOf(available);
        infos[index] = `(not ${available})`;
        mapPddl.set(key, infos);
    });

    const mePddl = [];
    mePddl.push(`(self me)`);
    mePddl.push(`(at me x${start.x}y${start.y})`);

    let init = [];
    init = init.concat(mePddl);
    objects.push(`me`);

    mapPddl.forEach(function (infos, key, map) {
        objects.push(`${key}`);
        init = init.concat(infos);
    });

    const goal = `at me x${Me.requested_x}y${Me.requested_y}`;

    const problemPddl = new PddlProblem(
        "path",
        objects.join(" "),
        init.join(" "),
        goal,
    );

    const domainPddl = fs.readFileSync("./domain.pddl", "utf8");
    let prova = await mySolver(domainPddl, problemPddl.toPddlString());
    // console.log("prova", prova);

    // if (prova === [[], []]) {
    //     console.log("problem", problemPddl.name);
    //     await problemPddl.saveToFile();
    // }

    // if (prova === undefined) {
    //     console.log(problemPddl.name);
    //     await problemPddl.saveToFile();
    // }

    let [actions, tiles] = prova;

    return {
        status:
            actions !== undefined && actions.length > 0 ? "success" : "failure",
        path: actions,
        tiles: tiles,
    };
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
    hash,
    isEnd,
    mySolver,
    sleep,
    computePath,
};
