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
        BeliefSet.getConfig().PARCEL_DECADING_INTERVAL /
        BeliefSet.getConfig().MOVEMENT_DURATION;
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
    score -= gonnaCarry * factor * (parcelDistance + closestDeliverySpotDistance); // me + parcel decading

    return score;
}

function computeDeliveryGain(deliverySpot) {
    let score = 0;

    const gonnaCarry = BeliefSet.getCarriedByMe().length;
    const factor =
        BeliefSet.getConfig().PARCEL_DECADING_INTERVAL /
        BeliefSet.getConfig().MOVEMENT_DURATION;
    const distance = distanceBetween(
        BeliefSet.getMe().getMyPosition(),
        deliverySpot,
    );
    score += BeliefSet.getMyReward(); // me carrying
    score -= gonnaCarry * factor * distance; // me + parcel decading

    return score;
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export { getPath, isEnd, distanceBetween, computeActions, computeParcelGain, computeDeliveryGain, sleep };
