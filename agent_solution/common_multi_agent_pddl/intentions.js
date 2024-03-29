import BeliefSet from "./belief.js";
import Communication from "./communication.js";
import {
    computeActions,
    computeDeliveryGain,
    computeParcelGain,
    sleep,
} from "./helpers.js";
import Me from "./me.js";
import { TileType } from "./world.js";
import Coordinator from "./coordinator.js";

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

    static async achieve(client) {
        // if (this.shouldStop) {
        //     console.log(BeliefSet.getMe().id, "stopped before going to target", this.requestedIntention.tile);
        //     this.shouldStop = false;
        //     this.success = false;
        //     throw "error";
        // }

        // TODO: understand why this.requestedIntention is null sometimes
        let path = await Me.pathTo(client, this.requestedIntention.tile);

        if (path.status === "success") {
            let actions = path.path;
            let failed = false;

            this.shouldStop = false;

            while (actions.length > 0) {
                console.log(
                    "---------------------------------------------------",
                );
                if (this.shouldStop === false) {
                    const action = actions.shift();

                    try {
                        await BeliefSet.getMe().do_action(client, action);
                    } catch (err) {
                        console.log("Failed movement", err);
                        failed = true;
                        // this.success = false;
                        // this.shouldStop = true;
                    }
                }

                await BeliefSet.getMe().performAction(
                    client,
                    this.requestedIntention,
                );
                await sleep(200);

                // let newBest = await Communication.Agent.sendBelief(client, {
                //     info: BeliefSet.getMe(),
                //     perceivedParcels: Array.from(BeliefSet.getParcels()),
                //     perceivedAgents: Array.from(BeliefSet.getAgents()),
                //     carriedByMe: BeliefSet.getCarriedByMe(),
                // });

                // if (
                //     failed &&
                //     Coordinator.equalsIntention(
                //         newBest,
                //         this.requestedIntention,
                //     )
                // ) {
                //     console.log(
                //         "swapping",
                //         Intentions.requestedIntention,
                //         newBest,
                //     );
                //     previousIntention = this.requestedIntention;
                //     Intentions.requestedIntention =
                //         await Communication.Agent.swapIntention(
                //             client,
                //             newBest,
                //         );
                //
                //     failed = false;
                // }

                // console.log(
                //     BeliefSet.getMe(),
                //     newBest,
                //     Intentions.requestedIntention,
                // );

                if (
                    this.shouldStop // ||
                    // (this.requestedIntention.gain < newBest.gain &&
                    //     (this.requestedIntention.tile.x !== newBest.tile.x ||
                    //         this.requestedIntention.tile.y !== newBest.tile.y))
                ) {
                    console.log("New intention found");

                    await Communication.Agent.setIntentionStatus(
                        client,
                        {
                            agentId: BeliefSet.getMe().id,
                            intention: this.requestedIntention,
                            isActive: true,
                            forcedDelivery: false,
                        },
                        false,
                    );

                    // previousIntention = this.requestedIntention;
                    // this.requestedIntention = newBest;
                    this.shouldStop = false;

                    // path = Me.pathTo(this.requestedIntention.tile);
                    //
                    // if (path.status === "success") {
                    //     actions = computeActions(path.path);
                    // } else {
                    //     throw "Path not found";
                    // }
                }
            }

            // if (this.shouldStop || failed) {
            //     console.log(BeliefSet.getMe().id, "stopped before reaching target", this.requestedIntention.tile);
            //     this.shouldStop = true;
            //     failed = true;
            //     this.success = false;
            //     throw "error";
            // }

            if (!failed) {
                console.log(BeliefSet.getMe().id, "target tile reached!");
                await BeliefSet.getMe().performAction(
                    client,
                    this.requestedIntention,
                );

                if (this.requestedIntention.parcel) {
                    BeliefSet.removeParcel(this.requestedIntention.parcel.id);
                }
                failed = false;
                this.success = true;
                return Promise.resolve();
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
