import BeliefSet from "./belief.js";
import { computeActions, sleep } from "./helpers.js";
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
        // console.log("Desires ", desires.length, desires);
        
        // console.log("prima", this.queue.length, desires);
        for (let desire of desires) {
            // check if the same tile is already in the queue, and update the gain
            const existingDesireIndex = this.queue.findIndex(d => d.tile.equals(desire.tile));
            // console.log("existingDesireIndex", existingDesireIndex);
            if (existingDesireIndex !== -1) {
                this.queue[existingDesireIndex].gain = desire.gain;
            } else {
                // console.log("adding desire ", desire);
                this.queue.push(desire);
            }
        }
        // console.log("dopo", this.queue.length, desires[0]);
    }

    static sort() {
        this.queue.sort((a, b) => {
            return b.gain - a.gain;
        });
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
                    await BeliefSet.me.do_action(client, action);
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

            if (!this.shouldStop) {
                if (this.requestedIntention.tile.type === TileType.DELIVERY && BeliefSet.getCarriedByMe().length > 0) {
                    if (BeliefSet.me.last_x === this.requestedIntention.tile.x && BeliefSet.me.last_y === this.requestedIntention.tile.y) {
                        await BeliefSet.me.do_action(client, Actions.PUT_DOWN);
                        BeliefSet.emptyCarriedByMe();
                    }
                } else if (this.requestedIntention.tile.type !== TileType.DELIVERY) {
                    let perceivedParcels = Array.from(BeliefSet.getParcels());
                    
                    for (let parcel in perceivedParcels) {
                        if (perceivedParcels[parcel].carriedBy === null && 
                            perceivedParcels[parcel].x === BeliefSet.me.last_x && 
                            perceivedParcels[parcel].y === BeliefSet.me.last_y) {
                            
                            await BeliefSet.me.do_action(client, Actions.PICKUP);
                            
                            if (perceivedParcels[parcel].carriedBy === BeliefSet.me.id) {
                                BeliefSet.setCarriedByMe(perceivedParcels[parcel]);
                                BeliefSet.removeParcel(perceivedParcels[parcel].id);
                            }
                            break;
                        }
                    }
                }
                this.queue = this.queue.filter(
                    (d) => d.tile !== this.requestedIntention.tile,
                );
            }
        } else {
            throw "Path not found";
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}

export { Intention, Intentions };

