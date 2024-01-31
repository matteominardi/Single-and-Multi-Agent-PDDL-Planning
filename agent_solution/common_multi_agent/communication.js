import Coordinator from "./coordinator.js";
import { Intentions } from "./intentions.js";

class Messages {
    static SEARCH_COORDINATOR = "search_coordinator";
    static IM_COORDINATOR = "im_coordinator";
    static AGENT_BELIEF = "agent_belief";
    static INTENTION = "intention";
    static SWAP_INTENTION = "swap_intention";
    static STOP_INTENTION = "stop_intention";
    static REMOVE_INTENTION = "remove_intention";
    static SET_INTENTION_STATUS = "set_intention_status";
    static SET_CARRYING = "set_carrying";
    static EMPTY_CARRYING = "empty_carrying";
    static ACK = "ack";
}

class Communication {
    static args;

    static Agent = class {
        static coordinator = null;
        static agentId;

        static async handle(client, id, name, msg, reply) {
            // reply = this.fixReply(client, reply);
            msg = this.fromJSON(msg);
            if (msg.message === Messages.IM_COORDINATOR) {
                this.coordinator = id;
                console.log(name, "is the coordinator");
                reply(this.toJSON(Messages.ACK));
            } else if (msg.message === Messages.STOP_INTENTION) {
                console.log("Impossible ", msg.args.intention, Intentions.requestedIntention);
                if (msg.args.agentId !== this.agentId && 
                    Intentions.requestedIntention &&
                    Coordinator.equalsIntention(msg.args.intention, Intentions.requestedIntention)
                ) {
                    Intentions.shouldStop = true;
                } else {
                    Intentions.shouldStop = false;
                }
            }
        }

        static async setCarrying(client, parcel) {
            await client.ask(
                this.coordinator,
                this.toJSON(Messages.SET_CARRYING, parcel),
            );
        }

        static async emptyCarrying(client, id) {
            await client.ask(
                this.coordinator,
                this.toJSON(Messages.EMPTY_CARRYING, id),
            );
        }

        static searchCoordinator(client, info) {
            client.shout(this.toJSON(Messages.SEARCH_COORDINATOR, info));
        }

        static async sendBelief(client, belief) {
            let res = await client.ask(
                this.coordinator,
                this.toJSON(Messages.AGENT_BELIEF, belief),
            );
            res = JSON.parse(await res);
            return await res.args;
        }

        static async swapIntention(client, intention) {
            let res = await client.ask(
                this.coordinator,
                this.toJSON(Messages.SWAP_INTENTION, intention),
            );
            res = JSON.parse(await res);
            return await res.args;
        }

        static async removeCompletedIntention(client, intention) {
            await client.ask(
                this.coordinator,
                this.toJSON(Messages.REMOVE_INTENTION, intention),
            );
        }

        static async setIntentionStatus(client, intention, status) {
            // console.log("setting intention status", intention, status);
            await client.ask(
                this.coordinator,
                this.toJSON(Messages.SET_INTENTION_STATUS, {
                    intention: intention,
                    status: status,
                }),
            );
        }

        static fixReply(reply, client) {
            if (reply) return reply;
            else return this.customReply.bind({ client: client });
        }

        static customReply(id, msg) {
            return this.client.ask(id, this.toJSON(msg));
        }

        static fromJSON(msg) {
            return JSON.parse(msg);
        }

        static toJSON(msg, args) {
            if (args) msg = { message: msg, args: args };
            else msg = { message: msg };
            return JSON.stringify(msg);
        }
    };

    static Coord = class {
        static async handle(client, id, name, msg, reply) {
            // reply = this.fixReply(client, reply);
            msg = this.fromJSON(msg);
            if (msg.message === Messages.SEARCH_COORDINATOR) {
                console.log("position", msg.args);
                Coordinator.updateAgent(id, msg.args);
                console.log(name, "is searching for a coordinator");
                await client.ask(id, this.toJSON(Messages.IM_COORDINATOR));
            } else if (msg.message === Messages.AGENT_BELIEF) {
                let perceivedParcels = msg.args.perceivedParcels;
                let perceivedAgents = msg.args.perceivedAgents;
                let carriedBy = msg.args.carriedBy;

                Coordinator.updateAgent(id, msg.args.info);
                
                Coordinator.addPerceivedParcels(perceivedParcels);
                Coordinator.addPerceivedAgents(perceivedAgents);
                
                Coordinator.ignoreOpponentsParcels();
                Coordinator.decayAllIntentionGains();

                Coordinator.computeAllDesires();
                // Coordinator.coordinateIntentions();

                let target = await Coordinator.getBestCoordinatedIntention(client, id);
                // console.log("Communication target ", target);
                // console.log(name, "has intention", target);
                reply(this.toJSON(Messages.INTENTION, target));
            } else if (msg.message == Messages.SWAP_INTENTION) {
                let target = Coordinator.shiftAgentIntentions(client, id, msg.args);
                reply(this.toJSON(Messages.INTENTION, target));
            }else if (msg.message == Messages.REMOVE_INTENTION) {
                Coordinator.removeCompletedIntention(msg.args);
                reply(this.toJSON(Messages.ACK));
            } else if (msg.message == Messages.SET_INTENTION_STATUS) {
                Coordinator.setIntentionStatus(
                    msg.args.intention,
                    msg.args.status,
                );
                reply(this.toJSON(Messages.ACK));
            } else if (msg.message == Messages.EMPTY_CARRYING) {
                Coordinator.removeParcel(id, msg.args);
                Coordinator.removeDeliveryIntentions(id);
                reply(this.toJSON(Messages.ACK));
            }
        }

        static fixReply(client, reply) {
            if (reply) return reply;
            else
                return (id, msg) => {
                    console.log("sending", msg, "to", client);
                    return client.ask(id, this.toJSON(msg));
                };
        }

        static fromJSON(msg) {
            return JSON.parse(msg);
        }

        static toJSON(msg, args) {
            if (args) msg = { message: msg, args: args };
            else msg = { message: msg };
            return JSON.stringify(msg);
        }

        static async stopAgentIntention(client, id, intention) {
            await client.shout(
                this.toJSON(Messages.STOP_INTENTION, {agentId: id, intention: intention}),
            );
        }
    };
}

export default Communication;
