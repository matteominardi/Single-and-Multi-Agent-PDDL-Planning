import BeliefSet from "./belief.js";
import { computeActions, computeDeliveryGain, computeParcelGain } from "./helpers.js";
import Me from "./me.js";
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
                if (intention.tile.type === TileType.DELIVERY) {
                    intention.gain = computeDeliveryGain(intention.tile);
                }
            }
        }
    }

    static filterGains() {
        this.queue = this.queue.filter(
            (d) => d.gain > 0,
        );
    }

    static getBestIntention() {
        console.log("queue", this.queue);
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
            const perceivedAgents = Array.from(BeliefSet.getAgents());

            const existsIntersection = path.path.some((tile) =>
                perceivedAgents.some((agent) => agent.x === tile.x && agent.y === tile.y),
            );

            if (existsIntersection) {
                console.log(BeliefSet.getMe().id, "path blocked by another agent");
                this.success = false;
                // throw "path blocekd";
                return;
            }
            
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

            if (this.shouldStop) {
                console.log(BeliefSet.getMe().id, "stopped before reaching target", this.requestedIntention.tile);
                this.shouldStop = false;
                this.success = false;
                return;
            }
            
            if (!failed) {
                console.log(BeliefSet.getMe().id, "target tile reached!");      
                await BeliefSet.getMe().performAction(client);
                this.success = true;
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

