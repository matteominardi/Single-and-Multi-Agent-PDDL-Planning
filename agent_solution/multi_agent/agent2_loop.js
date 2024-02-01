import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import dotenv from "dotenv";
import BeliefSet from "../common_multi_agent/belief.js";
import Communication from "../common_multi_agent/communication.js";
import Coordinator from "../common_multi_agent/coordinator.js";
import { sleep } from "../common_multi_agent/helpers.js";
import { Intentions } from "../common_multi_agent/intentions.js";
import {
    initMap,
    updateAgents,
    updateConfig,
    updateMe,
    updateParcels,
} from "./callbacks.js";

dotenv.config();
console.log("Starting agent2 Luca");
console.log("Connecting to", process.env.URL);

const client = new DeliverooApi(process.env.URL, 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJlMGRmNmI4ODAzIiwibmFtZSI6Im1hdHRpYSIsImlhdCI6MTcwNjcxNzM5NH0.3-ejlC6XG3ZtCKmda6nXeAKdqrBJ9yHNKvAbBNQjkfc"
);

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));
client.onConfig((config) => updateConfig(config));
client.onMsg((id, name, msg, reply) =>
    Communication.Agent.handle(client, id, name, msg, reply),
);

let previousTarget = null;
let patrolling = false;
let failed = false;

setTimeout(() => {
    Communication.Agent.searchCoordinator(client, BeliefSet.getMe());
}, 1000);

setTimeout(async () => {
    let agentId = BeliefSet.getMe().id;

    if (!agentId) {
        console.log("Agent", agentId, "not found");
        return;
    }

    Communication.Agent.agentId = agentId;

    while (true) {
        BeliefSet.decayParcelsReward();
        // Intentions.decayGains();
        // Intentions.filterGains();

        let perceivedParcels = Array.from(BeliefSet.getParcels());
        perceivedParcels = perceivedParcels.filter(
            (parcel) => parcel.reward > 2,
        );

        let perceivedAgents = Array.from(BeliefSet.getAgents());
        
        let target = await Communication.Agent.sendBelief(client, {
            info: BeliefSet.getMe(),
            perceivedParcels: perceivedParcels,
            perceivedAgents: perceivedAgents,
            carriedByMe: BeliefSet.getCarriedByMe(),
        });

        Intentions.requestedIntention = target;

        if (failed && Coordinator.equalsIntention(target, previousTarget)) {
            console.log(agentId, "swapping", Intentions.requestedIntention, previousTarget);

            Intentions.requestedIntention = await Communication.Agent.swapIntention(client, Intentions.requestedIntention);
            console.log("obtained after swapping", Intentions.requestedIntention);
            failed = false;
        }

        if (BeliefSet.getCarriedByMe().length === 0) {
            if (!patrolling && Intentions.requestedIntention.gain <= 1) {
                console.log(agentId, "started patrolling");
                patrolling = true;
            } else if (patrolling && Intentions.requestedIntention.gain <= 1) {
                console.log(agentId, "patrolling");
            } else if (patrolling && Intentions.requestedIntention.gain > 1) {
                console.log(agentId, "stopped patrolling");
                patrolling = false;
            }
        }

        if (!previousTarget || !patrolling) {
            previousTarget = Intentions.requestedIntention;
        }

        await Intentions.achieve(client)
        .then(async () => {
            console.log("Sono nel then");
            await Communication.Agent.removeCompletedIntention(
                client,
                Intentions.requestedIntention,
            );
        })
        .catch(async (error) => {
            console.log("Sono nel catch", error);
            failed = true;
            await Communication.Agent.setIntentionStatus(
                client,
                { 
                    agentId: agentId, 
                    intention: Intentions.requestedIntention, 
                    isActive: true 
                },
                false,
            );
        });
    }
}, 2000);

export { client };
