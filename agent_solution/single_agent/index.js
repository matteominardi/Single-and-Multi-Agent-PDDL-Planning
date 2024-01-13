import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import dotenv from "dotenv";
import BeliefSet from "../common/belief.js";
import { computeActions, getPath, sleep } from "../common/helpers.js";
import Me, { Actions } from "../common/me.js";
import {
    initMap,
    updateAgents,
    updateConfig,
    updateMe,
    updateParcels,
} from "./callbacks.js";
import Desires from "../common/desires.js";
import { Intentions } from "../common/intentions.js";

dotenv.config();

console.log("Starting agent", process.env.TOKEN);

const client = new DeliverooApi(URL, process.env.TOKEN);

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));
client.onConfig((config) => updateConfig(config));

let currentAction = null;
let currentIntention = null;
let failed = false;

setTimeout(async () => {
    while (true) {
        let start = BeliefSet.getMe().getMyPosition();
        let options = Desires.computeDesires();
        Intentions.add(...options);
        Intentions.sort();
        // intention_queue = intention_queue[:5]
        let target = Intentions.getBestIntention();

        currentIntention = target;

        // TODO: create loop with subloop for each action in place, so an action can be stopped from the outside, stopping the intention and making it possible to swap it with new ones
        // if (currentIntention === null || Intentions.success) {
        //     currentIntention = target;
        // } else if (currentIntention.gain < target.gain) {
        //     currentIntention.stop();
        //     currentIntention = target;
        // }

        await Intentions.achieve(client, currentIntention).catch((error) => {
            console.log("Failed intention", error);
            failed = true;
        });

        // // qui
        // if (!failed) {
        //     if (
        //         BeliefSet.getMap().isDeliverySpot(
        //             BeliefSet.getMe().getMyPosition(),
        //         )
        //     ) {
        //         await BeliefSet.me.do_action(client, Actions.PUT_DOWN);
        //         BeliefSet.emptyCarriedByMe();
        //     } else if (BeliefSet.isParcel(BeliefSet.getMe().getMyPosition())) {
        //         await BeliefSet.me.do_action(client, Actions.PICKUP);
        //         BeliefSet.setCarriedByMe(BeliefSet.getMe().getMyPosition());
        //     }
        // }

        Intentions.queue.shift();
        await sleep(100);

        // console.log(parcel, BeliefSet.getCarriedByMe().length === 0);
        // if (
        //     (parcel === null || BeliefSet.getMap().isDeliverySpot(parcel)) &&
        //     BeliefSet.getCarriedByMe().length === 0
        // ) {
        //     console.log("quit");
        //     // TODO: check with the agent wants to move one block away when reaching the delivery spot
        //     break; // molto brutto ma proof of concept
        // } else if (parcel === null) {
        //     console.log("delivery", delivery.x, delivery.y);
        //     Me.requested_x = delivery.x;
        //     Me.requested_y = delivery.y;
        // } else {
        //     Me.requested_x = parcel.x;
        //     Me.requested_y = parcel.y;
        // }
        // const path = getPath(start);
        // if (path.status === "success") {
        //     const actions = computeActions(path.path);
        //     for (let a in actions) {
        //         await BeliefSet.me.do_action(client, actions[a]);
        //         await sleep(1000);
        //     }
        // }
        // if (parcel !== null) {
        //     await BeliefSet.me.do_action(client, Actions.PICKUP);
        //     BeliefSet.setCarriedByMe(parcel);
        // } else {
        //     await BeliefSet.me.do_action(client, Actions.PUT_DOWN);
        //     BeliefSet.emptyCarriedByMe();
        // }
        // await sleep(100);
    }
}, 1000);

export { client };
