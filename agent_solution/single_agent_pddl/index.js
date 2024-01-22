import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { onlineSolver, PddlDomain, PddlProblem } from "@unitn-asa/pddl-client";
import dotenv from "dotenv";
import * as fs from "fs";
import BeliefSet from "../common_pddl/belief.js";
import Desires from "../common_pddl/desires.js";
import { mySolver, sleep } from "../common_pddl/helpers.js";
import { Intentions } from "../common_pddl/intentions.js";
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
let patrolling = false;
let failed = false;
let domain;

setTimeout(async () => {
    while (true) {
        BeliefSet.decayParcelsReward();
        Intentions.decayGains();
        Intentions.filterGains();

        let perceivedParcels = Array.from(BeliefSet.getParcels());
        console.log(
            "perceivedParcels",
            perceivedParcels.length,
            perceivedParcels,
        );

        let options = Desires.computeDesires();
        Intentions.add(options);
        Intentions.sort();
        console.log("queue", Intentions.queue.length, Intentions.queue);

        let target = Intentions.getBestIntention();
        console.log("new target", target.tile.x, target.tile.y, target.gain);

        if (failed && target.equals(previousTarget)) {
            console.log("swapping");
            Intentions.queue.shift();
            target = Intentions.getBestIntention();
            failed = false;
        }

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
        Intentions.requestedIntention = target;

        // if (previousTarget === target) {
        let problemPddl = BeliefSet.toPddl(target).toPddlString();
        let domain = fs.readFileSync("./domain.pddl", "utf8");

        await Intentions.achieve(client, domain, problemPddl)
            .then(() => {
                // if (Intentions.shouldStop) {
                //     failed = true;
                // }
            })
            .catch((error) => {
                console.log("Failed intention", error);
                failed = true;
            });
        // }

        console.log("---------------------------------------------------");
        await sleep(100);
    }
}, 1000);

export { client };