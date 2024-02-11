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
    while (true) {
        BeliefSet.decayParcelsReward();
        Intentions.decayGains();
        Intentions.filterGains();

        let perceivedParcels = Array.from(BeliefSet.getParcels());
        // console.log(
        //     "perceivedParcels",
        //     perceivedParcels.length,
        //     perceivedParcels,
        // );

        let options = Desires.computeDesires();
        Intentions.add(options);
        Intentions.sort();
        // console.log("queue", Intentions.queue.length, Intentions.queue);
        let target = Intentions.getBestIntention();
        // console.log("new target", target.tile.x, target.tile.y, target.gain);
        // console.log(BeliefSet.getMe().getMyPosition());

        if (
            failed &&
            target.tile.x === previousTarget.tile.x &&
            target.tile.y === previousTarget.tile.y
        ) {
            console.log("swapping");
            Intentions.queue.shift();
            target = Intentions.getBestIntention();
            failed = false;
        }
        // else if (previousTarget && !target.equals(previousTarget) && target.gain > previousTarget.gain) {
        //     console.log("changing ", previousTarget.tile.x, previousTarget.tile.y, previousTarget.gain,
        //                 "with ", target.tile.x, target.tile.y, target.gain);
        //     Intentions.stop();
        // }

        if (BeliefSet.getCarriedByMe().length === 0) {
            if (!patrolling && target.gain <= 1) {
                console.log("started patrolling");
                patrolling = true;
            } else if (patrolling && target.gain <= 1) {
                console.log("patrolling");
            } else if (patrolling && target.gain > 1) {
                console.log("stopped patrolling");
                patrolling = false;
            }
        }

        if (!previousTarget || !patrolling) {
            previousTarget = target;
        }
        // else if (patrolling) {
        //     target = previousTarget;
        // }
        Intentions.requestedIntention = target;

        // if (currentIntention === null || Intentions.success) {
        //     currentIntention = target;
        // } else if (currentIntention.gain < target.gain) {
        //     currentIntention.stop();
        //     currentIntention = target;
        // }

        await Intentions.achieve(client)
            .then(() => {
                // if (Intentions.shouldStop) {
                //     failed = true;
                // }
            })
            .catch((error) => {
                console.log("Failed intention", error);
                if (target.parcel) {
                    BeliefSet.ignoredParcels.add(target.parcel);
                }
                // setTimeout(() => {
                //     BeliefSet.ignoredParcels.delete(target.tile);
                // }, 10000);
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
        console.log("---------------------------------------------------");
        await sleep(100);
    }
}, 1000);

export { client };
