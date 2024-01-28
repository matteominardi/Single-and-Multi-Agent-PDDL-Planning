import { onlineSolver } from "@unitn-asa/pddl-client";
import BeliefSet from "./belief.js";
import Desires from "./desires.js";
import { computeDeliveryGain, computeParcelGain, mySolver } from "./helpers.js";
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
        const perceivedAgents = BeliefSet.getAgents();

        let [actions, tiles] = await mySolver(domain, problem);

        const existsIntersection = tiles.some((tile) =>
            perceivedAgents.some(
                (agent) => agent.x === tile.x && agent.y === tile.y,
            ),
        );

        if (existsIntersection) {
            console.log(BeliefSet.getMe().id, "path blocked by another agent");
            this.success = false;
            // throw "path blocekd";
            return;
        }

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

            await BeliefSet.getMe().performAction();
        }

        if (!this.shouldStop) {
            this.success = true;
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}

export { Intention, Intentions };
