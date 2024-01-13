import Me, { Actions } from "./me.js";
import { computeActions } from "./helpers.js";
import BeliefSet from "./belief.js";
import Belief from "./belief.js";
import { TileType } from "./world.js";

class Intention {
    constructor(desire) {
        this.tile = desire.tile;
        this.gain = desire.gain;
        this.parcel = desire.parcel;
    }
}

class Intentions {
    static queue = [];
    static shouldStop = false;
    static success = false;

    static add(desire) {
        this.queue.push(desire);
    }

    static sort() {
        this.queue.sort((a, b) => {
            return a.gain - b.gain;
        });
    }

    static getBestIntention() {
        return new Intention(this.queue[0]);
    }

    static async achieve(client, intention) {
        // prendo la prima intenzione dalla coda
        // calcolo la path per arrivare là
        // se la path è valida, la seguo, fino a che non arrivo o la interrompo
        // se la path non è valida, la scarto

        const path = Me.pathTo(intention.tile);
        if (path.status === "success") {
            // seguo il path
            const actions = computeActions(path.path);
            while (actions.length > 0 && !this.shouldStop) {
                const action = actions.shift();
                try {
                    await BeliefSet.me.do_action(client, action);
                } catch (err) {
                    console.log(err);
                    throw err; // movimento non riuscito
                }
            }

            if (actions.length === 0) {
                this.success = true;
            }

            if (!this.shouldStop) {
                if (intention.tile.type === TileType.DELIVERY) {
                    await BeliefSet.me.do_action(client, Actions.PUT_DOWN);
                    BeliefSet.emptyCarriedByMe();
                } else if (intention.parcel) {
                    await BeliefSet.me.do_action(client, Actions.PICKUP);
                    BeliefSet.setCarriedByMe(intention.parcel);
                    BeliefSet.removeParcel(intention.parcel.id);
                }
                this.shouldStop = false;
                this.queue = this.queue.filter(
                    (d) => d.tile !== intention.tile,
                );
            }
        } else {
            throw "Path not found";
        }
    }

    async stop() {
        this.shouldStop = true;
    }
}

export { Intentions, Intention };
