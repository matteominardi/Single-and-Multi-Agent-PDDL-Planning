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

dotenv.config();

console.log("Starting agent", process.env.TOKEN);

const client = new DeliverooApi(process.env.URL, process.env.TOKEN);

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));
client.onConfig((config) => updateConfig(config));

let previousTarget = null;
let failed = false;

setTimeout(async () => {
    while (true) {
        let options = Desires.computeDesires();
        Intentions.add(options);
        Intentions.sort();
        // intention_queue = intention_queue[:5]
        let target = Intentions.getBestIntention();
        console.log("target", target.tile.x, target.tile.y, target.gain);
        
        if (failed && target.equals(previousTarget)) {
            console.log("swapping");
            Intentions.queue.shift();
            target = Intentions.getBestIntention();
        }

        previousTarget = target;

        // TODO: create loop with subloop for each action in place, so an action can be stopped from the outside, stopping the intention and making it possible to swap it with new ones
        // if (currentIntention === null || Intentions.success) {
        //     currentIntention = target;
        // } else if (currentIntention.gain < target.gain) {
        //     currentIntention.stop();
        //     currentIntention = target;
        // }

        Intentions.requestedIntention = target;

        await Intentions.achieve(client).then(() => {
            // if (Intentions.shouldStop) {
            //     failed = true;
            // }
        }).catch(error => {
            console.log("Failed intention", error);
            failed = true;
        });

        // if (failed && Intentions.queue.length > 1) {
        //     console.log("swapping");
        //     // console.log(Intentions.queue[0], Intentions.queue[1]);
        //     [Intentions.queue[0], Intentions.queue[1]] = [Intentions.queue[1], Intentions.queue[0]];
        //     // console.log(Intentions.queue[0], Intentions.queue[1]);
        // } else if (Intentions.queue.length == 0) {
        //     console.log("patrolling");
  
        // } else {
        //     console.log("passing into the next intention");
        //     Intentions.queue.shift();
        // }
        await sleep(100);
    }
}, 1000);

export { client };
