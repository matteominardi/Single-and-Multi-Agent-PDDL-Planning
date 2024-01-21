import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import dotenv from "dotenv";
import Desires from "../common/desires.js";
import { sleep } from "../common/helpers.js";
import { Intentions } from "../common/intentions.js";
import {
    initMap,
    updateAgents,
    updateConfig,
    updateMe,
    updateParcels,
} from "./callbacks.js";
import BeliefSet from "../common/belief.js";

dotenv.config();

console.log("Starting agent", process.env.TOKEN);

const client = new DeliverooApi(process.env.URL, process.env.TOKEN);

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));
client.onConfig((config) => updateConfig(config));

let previousTarget = null;
let patrolling = false;
let failed = false;

setTimeout(async () => {
    agentId = BeliefSet.getMe().id;

    if (!agentId) {
        console.log("Agent", agentId, "not found");
        return;
    }

    if (!Coordinator.hasAgent(agentId)) {
        Coordinator.addAgent(agentId);
    }

    while (true) {
        BeliefSet.decayParcelsReward();
        Intentions.decayGains();
        Intentions.filterGains();

        let perceivedParcels = Array.from(BeliefSet.getParcels());
        console.log(agentId, "perceivedParcels", perceivedParcels.length, perceivedParcels)
        
        let options = Desires.computeDesires();
        Intentions.add(options);
        Intentions.sort();
        console.log(agentId, "queue", Intentions.queue.length, Intentions.queue)

        Coordinator.addAgentIntentions(agentId, Intentions.queue);
        Coordinator.coordinateIntentions();
        
        // let target = Intentions.getBestIntention();
        let target = Coordinator.getBestCoordinatedIntention(agentId);
        console.log(agentId, "new target", target.tile.x, target.tile.y, target.gain);
        
        if (failed && target.equals(previousTarget)) {
            console.log(agentId, "swapping");
            Intentions.queue.shift();
            target = Intentions.getBestIntention();
            failed = false;
        } 
        
        if (BeliefSet.getCarriedByMe().length === 0) {
            if (!patrolling && target.gain <= 1) {
                console.log(agentId, "started patrolling");
                patrolling = true;
            } else if (patrolling && target.gain <=1) {
                console.log(agentId, "patrolling");
            } else if (patrolling && target.gain > 1) {
                console.log(agentId, "stopped patrolling");
                patrolling = false;
            }
        }

        if (!previousTarget || !patrolling) {
            previousTarget = target;
        } 
        
        Intentions.requestedIntention = target;

        await Intentions.achieve(client).then(() => {
            Coordinator.removeCompletedIntention(target);
        }).catch(error => {
            console.log("Failed intention", error);
            failed = true;
            Coordinator.setInactiveIntention(agentId, target);
        });
        console.log("---------------------------------------------------");
        await sleep(100);
    }
}, 1000);

export { client };
