import BeliefSet from "./belief.js";
import { computeActions, computeDeliveryGain, computeParcelGain } from "./helpers.js";
import Me, { Actions } from "./me.js";
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
            const existingDesireIndex = this.queue.findIndex(d => d.tile.equals(desire.tile));
            
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
                intention.gain = computeDeliveryGain(intention.tile);
            }
        }
    }

    static filterGains() {
        this.queue = this.queue.filter(
            (d) => d.gain > 0,
        );
    }

    static getBestIntention() {
        return new Intention(this.queue[0]);
    }

    static async achieve(client) {
        // prendo la prima intenzione dalla coda
        // calcolo la path per arrivare là
        // se la path è valida, la seguo, fino a che non arrivo o la interrompo
        // se la path non è valida, la scarto

        if (this.shouldStop) {
            console.log("exiting");
            this.shouldStop = false;
            return;
        }
        

        const path = Me.pathTo(this.requestedIntention.tile);
        if (path.status === "success") {
            // seguo il path
            const actions = computeActions(path.path);
            let failed = false;

            // while (actions.length > 0 && !this.shouldStop) {
            if (actions.length > 0 && !this.shouldStop) {
                const action = actions.shift();
                try {
                    await BeliefSet.getMe().do_action(client, action);
                } catch (err) {
                    console.log(err);
                    failed = true;
                    throw err;
                }
            }

            // if (actions.length === 0) {
            if (!failed) {
                this.success = true;
            }

            // if (!this.shouldStop) {
            let currentTile = BeliefSet.getMe().getMyPosition();
            console.log("currentTile", currentTile.x, currentTile.y, currentTile.type)
            console.log("my reward ", BeliefSet.getMyReward(), "getCarriedByMe", BeliefSet.getCarriedByMe().length)
            let perceivedParcels = Array.from(BeliefSet.getParcels());
            console.log("perceivedParcels", perceivedParcels.length, perceivedParcels)
            if (currentTile.type === TileType.DELIVERY && BeliefSet.getCarriedByMe().length > 0) {
                await BeliefSet.getMe().do_action(client, Actions.PUT_DOWN);
                BeliefSet.emptyCarriedByMe();
            } else if (currentTile.type === TileType.NORMAL) {
                for (let parcel in perceivedParcels) {
                    if (BeliefSet.shouldConsiderParcel(perceivedParcels[parcel].id) &&
                        perceivedParcels[parcel].carriedBy === null && 
                        perceivedParcels[parcel].x === currentTile.x && 
                        perceivedParcels[parcel].y === currentTile.y) { 
                        console.log("Trying to pick up", perceivedParcels[parcel])
                        await BeliefSet.getMe().do_action(client, Actions.PICKUP);
                        
                        BeliefSet.setCarriedByMe(perceivedParcels[parcel]);
                        this.queue = this.queue.filter(
                            (d) => (d.parcel ? d.parcel.id !== perceivedParcels[parcel].id : true),
                        );
                        break;
                    }
                }
            }
            this.queue = this.queue.filter(
                (d) => d.tile !== currentTile && d.gain > 0 && (d.parcel ? d.parcel.reward > 0 : true),
            );
            // }
        } else {
            throw "Path not found";
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}

export { Intention, Intentions };

