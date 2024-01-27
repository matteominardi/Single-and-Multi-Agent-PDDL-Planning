
class Messages {
    static SEARCH_COORDINATOR = "search_coordinator";
    static IM_COORDINATOR = "im_coordinator";
    static AGENT_BELIEF = "agent_belief";
    static ACK = "ack";
}

class Communication {

    static args;

    static Agent = class {

        static coordinator = null;

        static async handle(client, id, name, msg, reply) {
            // reply = this.fixReply(client, reply);
            msg = this.fromJSON(msg, args);
            if (msg.message == Messages.IM_COORDINATOR) {
                this.coordinator = id;
                console.log(name, 'is the coordinator');
                reply(this.toJSON(Messages.ACK));
            }
        }

        static searchCoordinator(client) {
            client.shout(this.toJSON(Messages.SEARCH_COORDINATOR));
        }

        static async sendBelief(client, belief) {
            await client.ask(this.coordinator, this.toJSON(Messages.AGENT_BELIEF, belief));
        }

        static fixReply(reply,client) {
            if (reply) return reply;
            else return this.customReply.bind({client: client})
        }

        static customReply(id, msg) {
            return this.client.ask(id, this.toJSON(msg));
        }

        static fromJSON(msg) {
            return JSON.parse(msg);
        }

        static toJSON(msg, args) {
            if (args) msg = { message: msg, args: args }
            else msg = { message: msg };
            return JSON.stringify(msg);
        }
    }

    static Coordinator = class {
            
        static async handle(client, id, name, msg, reply)  {
            // reply = this.fixReply(client, reply);
            msg = this.fromJSON(msg);
            if (msg.message == Messages.SEARCH_COORDINATOR) {
                console.log(name, 'is searching for a coordinator');
                await client.ask(id, this.toJSON(Messages.IM_COORDINATOR));
            } else if (msg.message == Messages.AGENT_BELIEF) {
                console.log("Agent", id, "has belief", msg.args);
                reply(this.toJSON(Messages.ACK));
            }
        }

        static fixReply(client, reply) {
            if (reply) return reply;
            else return (id, msg) => { 
                console.log('sending', msg, 'to', client);
                return client.ask(id, this.toJSON(msg));
            };
        }

        static fromJSON(msg) {
            return JSON.parse(msg);
        }

        static toJSON(msg, args) {
            if (args) msg = { message: msg, args: args }
            else msg = { message: msg };
            return JSON.stringify(msg);
        }

    }
}

export default Communication;