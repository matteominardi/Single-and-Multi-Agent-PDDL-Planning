import BeliefSet from "./belief.js";
import {
    computeDeliveryGain,
    computeParcelGain,
    distanceBetween,
    mySolver,
} from "./helpers.js";
import Me from "./me.js";
import { TileType } from "./world.js";
import Desires from "./desires.js";

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

            if (existingDesireIndex !== -1 && desire.gain !== Infinity) {
                this.queue[existingDesireIndex].gain = desire.gain;
            } else {
                this.queue.push(desire);
            }
        }
    }

    static sort() {
        this.queue.sort((a, b) => {
            if (a.gain !== b.gain) {
                return b.gain - a.gain;
            } else {
                return (
                    distanceBetween(BeliefSet.getMe().getMyPosition(), a.tile) -
                    distanceBetween(BeliefSet.getMe().getMyPosition(), b.tile)
                );
            }
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
                if (
                    intention.tile.type === TileType.DELIVERY &&
                    intention.gain !== Infinity
                ) {
                    intention.gain = computeDeliveryGain(intention.tile);
                }
            }
        }
    }

    static filterGains() {
        this.queue = this.queue.filter((d) => d.gain > 0);
    }

    static getBestIntention() {
        // console.log("queue", this.queue);
        if (this.queue.length === 0) {
            let options = Desires.computeDesires();
            Intentions.add(options);
            Intentions.sort();
            if (this.queue.length > 1) {
                return new Intention(this.queue[1]);
            } else {
                return new Intention(this.queue[0]);
            }
        } else {
            return new Intention(this.queue[0]);
        }
    }

    static async achieve(client, domain, problem) {
        // prendo la prima intenzione dalla coda
        // calcolo la path per arrivare là
        // se la path è valida, la seguo, fino a che non arrivo o la interrompo
        // se la path non è valida, la scarto

        if (this.shouldStop) {
            // console.log("exiting");
            this.shouldStop = false;
            return;
        }

        const path = Me.pathTo(this.requestedIntention.tile);
        if (path.status === "success") {
            const perceivedAgents = Array.from(BeliefSet.getAgents());

            let [actions, tiles] = await mySolver(domain, problem);

            console.log("actions", actions);

            // const existsIntersection = path.path.some((tile) =>
            //     perceivedAgents.some(
            //         (agent) => agent.x === tile.x && agent.y === tile.y,
            //     ),
            // );
            //
            // if (existsIntersection) {
            //     console.log(
            //         BeliefSet.getMe().id,
            //         "path blocked by another agent",
            //     );
            //     this.success = false;
            //     throw "path blocekd";
            //     // return;
            // }

            let failed = false;

            while (actions.length > 0 && !this.shouldStop) {
                // if (actions.length > 0 && !this.shouldStop) {
                const action = actions.shift();
                try {
                    await BeliefSet.getMe().do_action(client, action);
                } catch (err) {
                    console.log(err);
                    failed = true;
                    throw err;
                }

                await BeliefSet.getMe().performAction(client);
            }

            if (this.shouldStop) {
                // console.log(
                //     BeliefSet.getMe().id,
                //     "stopped before reaching target",
                //     this.requestedIntention.tile,
                // );
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
