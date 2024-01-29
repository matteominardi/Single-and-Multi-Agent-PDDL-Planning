import BeliefSet from "./belief.js";
import { computeActions, computeDeliveryGain, computeParcelGain } from "./helpers.js";
import Me from "./me.js";
import { TileType } from "./world.js";
import Communication from "./communication.js";

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
        return new Intention(this.queue[0]);
    }

    static async achieve(client) {
        if (this.shouldStop) {
            console.log(BeliefSet.getMe().id, "stopped before going to target", this.requestedIntention.tile);
            this.shouldStop = false;
            return;
        }
        
        const path = Me.pathTo(this.requestedIntention.tile);
        
        if (path.status === "success") {
            const actions = computeActions(path.path);
            let failed = false;

            while (actions.length > 0 && !this.shouldStop) {
            // if (actions.length > 0 && !this.shouldStop) {
                const action = actions.shift();

                // update beliefs
                let newBest = await Communication.Agent.sendBelief(
                    client,
                    {
                        info: BeliefSet.getMe(),
                        perceivedParcels: Array.from(BeliefSet.getParcels()),
                        perceivedAgents: Array.from(BeliefSet.getAgents()),
                    }
                );

                if (
                    this.requestedIntention.gain < newBest.gain &&
                    (this.requestedIntention.tile.x !== newBest.tile.x || this.requestedIntention.tile.y !== newBest.tile.y)
                ) {
                    console.log("New intention found");
                    Communication.Agent.setIntentionStatus(client, {agentId: BeliefSet.getMe().id, intention: this.requestedIntention, isActive: false}, false);
                    return;
                }
                try {
                    await BeliefSet.getMe().do_action(client, action);
                } catch (err) {
                    console.log(err);
                    failed = true;
                    throw err;
                }

                await BeliefSet.getMe().performAction(client, this.requestedIntention)
            }

            if (this.shouldStop) {
                console.log(BeliefSet.getMe().id, "stopped before reaching target", this.requestedIntention.tile);
                this.shouldStop = false;
                return;
            }
            
            if (!failed) {
                console.log(BeliefSet.getMe().id, "target tile reached!");      
                await BeliefSet.getMe().performAction(client, this.requestedIntention);
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

