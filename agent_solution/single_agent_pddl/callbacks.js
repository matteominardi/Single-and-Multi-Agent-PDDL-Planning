import BeliefSet from "../common_pddl/belief.js";
import { getPath } from "../common_pddl/helpers.js";

function updateParcels(parcels) {
    BeliefSet.updateParcels(parcels);
}

function updateAgents(agents) {
    BeliefSet.updateAgents(agents);
}

function initMap(width, height, tiles) {
    BeliefSet.initMap(width, height, tiles);
    console.log("Map initialized!");
}

function updateMe(me) {
    BeliefSet.updateMe(me);
    // console.log(BeliefSet.getMe());
}

function updateConfig(config) {
    BeliefSet.updateConfig(config);
    // console.log(BeliefSet.getConfig());
}

export { initMap, updateAgents, updateMe, updateParcels, updateConfig };
