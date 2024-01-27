import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import dotenv from "dotenv";
import Communication from "../common_multi_agent/communication.js";
// import {
//     initMap,
//     updateAgents,
//     updateConfig,
//     updateMe,
//     updateParcels,
// } from "./callbacks.js";

dotenv.config();

// console.log("Starting agent", process.env.TOKEN);

const client = new DeliverooApi(process.env.URL, process.env.TOKEN);

// client.onMap((w, h, tiles) => initMap(w, h, tiles));
// client.onParcelsSensing((parcels) => updateParcels(parcels));
// client.onAgentsSensing((agents) => updateAgents(agents));
// client.onYou((me) => updateMe(me));
// client.onConfig((config) => updateConfig(config));
client.onMsg((id, name, msg, reply) => Communication.Agent.handle(client, id, name, msg, reply));

let previousTarget = null;
let patrolling = false;
let failed = false;

setTimeout(() => { }, 2000);
Communication.Agent.searchCoordinator(client);

// setTimeout(async () => {
//     agentId = BeliefSet.getMe().id;

//     if (!agentId) {
//         console.log("Agent", agentId, "not found");
//         return;
//     }

//     if (!Coordinator.hasAgent(agentId)) {
//         Coordinator.addAgent(agentId);
//     }

//     Coordinator.updateBeliefs();

//     while (true) {
//         Coordinator.updateAgent(agentId, BeliefSet.getMe().tile);
//         let perceivedParcels = Array.from(BeliefSet.getParcels());
//         console.log(agentId, "perceivedParcels", perceivedParcels.length, perceivedParcels)

//         let perceivedAgents = Array.from(BeliefSet.getAgents());
//         console.log(agentId, "perceivedAgents", perceivedAgents.length, perceivedAgents)

//         Coordinator.addPerceivedParcels(perceivedParcels);
//         Coordinator.addPerceivedAgents(perceivedAgents);

//         Coordinator.computeAllDesires();
//         Coordinator.coordinateIntentions();
        
//         let target = Coordinator.getBestCoordinatedIntention(agentId);
//         console.log(agentId, "new target", target.tile.x, target.tile.y, target.gain);
        
//         if (failed && target.equals(previousTarget)) {
//             console.log(agentId, "swapping");

//             Coordinator.shiftAgentIntentions(agentId);
//             target = Coordinator.getBestCoordinatedIntention(agentId);
            
//             failed = false;
//         } 
        
//         if (BeliefSet.getCarriedByMe().length === 0) {
//             if (!patrolling && target.gain <= 1) {
//                 console.log(agentId, "started patrolling");
//                 patrolling = true;
//             } else if (patrolling && target.gain <=1) {
//                 console.log(agentId, "patrolling");
//             } else if (patrolling && target.gain > 1) {
//                 console.log(agentId, "stopped patrolling");
//                 patrolling = false;
//             }
//         }

//         if (!previousTarget || !patrolling) {
//             previousTarget = target;
//         } 
        
//         Intentions.requestedIntention = target;

//         await Intentions.achieve(client).then(() => {
//             Coordinator.removeCompletedIntention(target);
//         }).catch(error => {
//             console.log("Failed intention", error);
//             failed = true;
//             Coordinator.setIntentionStatus({agentId: agentId, intention: target, isActive: true}, false);
//         });
//         console.log("---------------------------------------------------");
//         await sleep(100);
//     }
// }, 1000);

export { client };
