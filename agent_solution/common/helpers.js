import aStar from "a-star";
import BeliefSet from "./belief.js";
import Me, { Actions } from "./me.js";

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
        BeliefSet.getClosestParcel(tile) +
        BeliefSet.getClosestDeliverySpot(tile)
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

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export { getPath, isEnd, distanceBetween, computeActions, sleep };
