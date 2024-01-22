import { onlineSolver } from "@unitn-asa/pddl-client";
import BeliefSet from "./belief.js";
import Desires from "./desires.js";
import { computeDeliveryGain, computeParcelGain } from "./helpers.js";
import { Actions } from "./me.js";
import { TileType } from "./world.js";

class Intention {
    constructor(desire) {
        this.tile = desire.tile;
        this.gain = desire.gain;
        this.parcel = desire.parcel;
    }
    equals(intention) {
        return this.tile.equals(intention.tile);
    }
}

class Intentions {
    static queue = [];
    static shouldStop = false;
    static success = false;
    static requestedIntention = null;

    static add(desires) {
        for (let desire of desires) {
            // check if the same tile is already in the queue, and update the gain
            const existingDesireIndex = this.queue.findIndex((d) =>
                d.tile.equals(desire.tile),
            );

            if (existingDesireIndex !== -1) {
                this.queue[existingDesireIndex].gain = desire.gain;
            } else {
                this.queue.push(desire);
            }
        }
    }

    static sort() {
        this.queue.sort((a, b) => {
            return b.gain - a.gain;
        });
    }

    static empty() {
        this.queue = [];
    }

    static decayGains() {
        for (let intention of this.queue) {
            if (intention.parcel) {
                intention.gain = computeParcelGain(intention.parcel);
            } else {
                if (intention.tile.type === TileType.DELIVERY) {
                    intention.gain = computeDeliveryGain(intention.tile);
                }
            }
        }
    }

    static filterGains() {
        this.queue = this.queue.filter((d) => d.gain > 0);
    }

    static getBestIntention() {
        return new Intention(this.queue[0]);
    }

    static async achieve(client, domain, problem) {
        const actions = await onlineSolver(domain, problem);
        const current_intention = Intentions.requestedIntention;
        while (actions.length > 0 && !this.shouldStop) {
            // if ((await actions.length) > 0) {
            const action = await actions.shift();

            let options = Desires.computeDesires();
            Intentions.add(options);
            Intentions.sort();

            const new_intention = this.getBestIntention();

            if (
                current_intention.gain < new_intention.gain &&
                !current_intention.tile.equals(new_intention.tile)
            ) {
                console.log("New intention found");
                return;
            }

            try {
                await BeliefSet.getMe().do_action(client, await action);
            } catch (err) {
                console.log(err);
                throw err;
            }

            let currentTile = await BeliefSet.getMe().getMyPosition();
            console.log(
                "currentTile",
                await currentTile.x,
                await currentTile.y,
                await currentTile.type,
            );
            console.log(
                "my reward ",
                BeliefSet.getMyReward(),
                "getCarriedByMe",
                BeliefSet.getCarriedByMe().length,
            );
            let perceivedParcels = Array.from(BeliefSet.getParcels());
            console.log(
                "perceivedParcels",
                perceivedParcels.length,
                perceivedParcels,
            );
            if (
                currentTile.type === TileType.DELIVERY &&
                BeliefSet.getCarriedByMe().length > 0
            ) {
                await BeliefSet.getMe().do_action(client, Actions.PUT_DOWN);
                BeliefSet.emptyCarriedByMe();
            } else if (currentTile.type === TileType.NORMAL) {
                for (let parcel in perceivedParcels) {
                    if (
                        BeliefSet.shouldConsiderParcel(
                            perceivedParcels[parcel].id,
                        ) &&
                        perceivedParcels[parcel].carriedBy === null &&
                        perceivedParcels[parcel].x === currentTile.x &&
                        perceivedParcels[parcel].y === currentTile.y
                    ) {
                        console.log(
                            "Trying to pick up",
                            perceivedParcels[parcel],
                        );
                        await BeliefSet.getMe().do_action(
                            client,
                            Actions.PICKUP,
                        );

                        BeliefSet.setCarriedByMe(perceivedParcels[parcel]);
                        this.queue = this.queue.filter((d) =>
                            d.parcel
                                ? d.parcel.id !== perceivedParcels[parcel].id
                                : true,
                        );
                        break;
                    }
                }
            }
            this.queue = this.queue.filter(
                (d) =>
                    d.tile !== currentTile &&
                    d.gain > 0 &&
                    (d.parcel ? d.parcel.reward > 0 : true),
            );
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}

export { Intention, Intentions };

