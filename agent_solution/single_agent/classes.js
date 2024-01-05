import { me, client, nearestDelivery } from "./index.js";
import depth_search_daemon from "./depth_search_daemon.js";

class IntentionRevision {
    intention_queue = new Array();
    current_intention = null;
    current_triple = [];

    get intention_queue() {
        return this.intention_queue;
    }

    log(...args) {
        console.log(...args);
    }

    async loop() {
        while (true) {
            if (this.intention_queue.length > 0) {
                console.log("intention_queue prima", this.intention_queue);
                function removeSublists(list) {
                    return list.filter(
                        (sublist, index) =>
                            !list.some(
                                (other, otherIndex) =>
                                    index !== otherIndex &&
                                    other[0] === sublist[0] &&
                                    other[1] === sublist[1] &&
                                    other[2] === sublist[2] &&
                                    other[3] > sublist[3],
                            ),
                    );
                }
                this.intention_queue = removeSublists(this.intention_queue);

                this.current_triple = [
                    this.intention_queue[0][0],
                    this.intention_queue[0][1],
                    this.intention_queue[0][2],
                ];
                const intention = new Intention(this, this.current_triple);

                this.current_intention = intention;

                await this.current_intention.achieve().catch((error) => {
                    console.log("Failed intention", error);
                });

                this.intention_queue.shift();

                if (me.carrying == 0)
                    this.intention_queue = this.intention_queue.filter(
                        (sublist) => sublist[0] !== "go_deliver",
                    );

                console.log("new queue", this.intention_queue);
            }

            // Postpone next iteration at setImmediate
            await new Promise((res) => setImmediate(res));
        }
    }
}

class IntentionRevisionRevise extends IntentionRevision {
    // TODO
    // - evaluate validity of intention MOLTO IMPORTANTE (con myBeliefset, oppure qui oppure dentro IntentionRevision loop)

    async push(intention) {
        if (me.x % 1 != 0 || me.y % 1 != 0) return;

        // intention = {instruction, x, y, gain}
        let intention_predicate = [
            intention.instruction,
            intention.x,
            intention.y,
            intention.gain,
        ];
        let is_already_queued = false;

        for (let intent of this.intention_queue) {
            if (
                intent
                    .slice(0, 3)
                    .every(
                        (value, index) =>
                            value === intention_predicate.slice(0, 3)[index],
                    )
            ) {
                intent[3] = intention.gain;
                is_already_queued = true;
            }
        }

        console.log("la queue", this.intention_queue);

        if (!is_already_queued) this.intention_queue.push(intention_predicate);

        console.log("prima del sort", this.intention_queue);

        this.intention_queue = Array.from(
            this.intention_queue
                .reduce((map, subArray) => {
                    const key = subArray.slice(0, 3).join("-");
                    if (
                        subArray[3] > 0 &&
                        (!map.has(key) || subArray[3] > map.get(key)[3])
                    ) {
                        map.set(key, subArray);
                    }
                    return map;
                }, new Map())
                .values(),
        ).sort((a, b) => b[3] - a[3]);

        console.log("dopo il sort", this.intention_queue);

        if (this.intention_queue.length > 0) {
            let current = this.current_triple;
            let new_best = this.intention_queue[0];
            if (
                current &&
                !current
                    .slice(0, 3)
                    .every(
                        (value, index) => value === new_best.slice(0, 3)[index],
                    )
            ) {
                console.log(
                    "stoppo la current ",
                    current,
                    " a favore di ",
                    new_best,
                );
                this.current_intention.stop();
            }
        }
    }
}

class Intention {
    #current_plan; // Plan currently used for achieving the intention
    #stopped = false; // This is used to stop the intention
    #parent; // #parent refers to caller
    #predicate; // will be in the form ['go_to', x, y]
    #started = false;

    constructor(parent, predicate) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    get predicate() {
        return this.#predicate;
    }

    get stopped() {
        return this.#stopped;
    }

    stop() {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if (this.#current_plan) this.#current_plan.stop();
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else console.log(...args);
    }

    async achieve() {
        if (this.#started) return this; // Cannot start twice

        this.#started = true;

        for (const planClass of planLibrary) {
            if (this.stopped) throw ["stopped intention", ...this.predicate];

            if (planClass.isApplicableTo(...this.predicate)) {
                this.#current_plan = new planClass(this.parent);
                this.log(
                    "achieving intention",
                    ...this.predicate,
                    "with plan",
                    planClass.name,
                );

                try {
                    const plan_res = await this.#current_plan.execute(
                        ...this.predicate,
                    );
                    this.log(
                        "succesful intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with result:",
                        plan_res,
                    );
                    return plan_res;
                } catch (error) {
                    this.log(
                        "failed intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with error:",
                        error,
                    );
                }
            }
        }

        if (this.stopped) throw ["stopped intention", ...this.predicate];
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ["no plan satisfied the intention ", ...this.predicate];
    }
}

class Plan {
    #sub_intentions = []; // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #stopped = false;
    #parent;

    constructor(parent) {
        this.#parent = parent;
    }

    get stopped() {
        return this.#stopped;
    }

    stop() {
        this.log("stop plan");
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else console.log(...args);
    }

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }
}

class GoPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == "go_pick_up";
    }

    async execute(go_pick_up, x, y) {
        // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE
        await this.subIntention(["go_to", x, y]);
        if (this.stopped) throw ["stopped"];
        let picked = await client.pickup();

        me.carrying += picked[0].reward;
        me.carrying_size += 1;

        if (this.stopped) throw ["stopped"];

        return true;
    }
}

class GoDeliver extends Plan {
    static isApplicableTo(go_deliver) {
        return go_deliver == "go_deliver";
    }

    async execute(go_deliver) {
        let deliveryTile = nearestDelivery(me);

        await this.subIntention(["go_to", deliveryTile.x, deliveryTile.y]);
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        await client.putdown();
        if (this.stopped) throw ["stopped"]; // if stopped then quit
        me.carrying = 0;
        me.carrying_size = 0;
        return true;
    }
}

class DepthSearchMove extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        const depth_search = depth_search_daemon(client);
        this.log("DepthSearchMove", "from", me.x, me.y, "to", { x, y });
        while (me.x != x || me.y != y) {
            const plan = depth_search(me, { x, y });
            console.log("plan", plan);
            client.socket.emit(
                "path",
                plan.map((step) => step.current),
            );

            if (plan.length == 0) {
                throw "target not reachable";
            }

            for (const step of plan) {
                if (this.stopped) throw ["stopped"]; // if stopped then quit

                const status = await client.move(step.action);

                if (status) {
                    me.x = status.x;
                    me.y = status.y;
                } else {
                    this.log(
                        "DepthSearchMove replanning",
                        "from",
                        me.x,
                        me.y,
                        "to",
                        { x, y },
                    );
                    break;
                }
            }
        }
        return true;
    }
}

class BlindMove extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        while (me.x != x || me.y != y) {
            // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE
            let status_x = false;
            let status_y = false;

            if (x > me.x) status_x = await client.move("right");
            // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if (x < me.x) status_x = await client.move("left");
            // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                // me.y = status_x.y; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
            }

            if (this.stopped) throw ["stopped"];

            if (y > me.y) status_y = await client.move("up");
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if (y < me.y) status_y = await client.move("down");
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                // me.x = status_y.x; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
                me.y = status_y.y;
            }

            if (this.stopped) throw ["stopped"];

            if (!status_x && !status_y) {
                this.log("stucked");
                throw "stucked";
            }
        }

        return true;
    }
}

class PddlMove extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        var pddlProblem = new PddlProblem(
            "domain",
            myBeliefset.objects.join(" "),
            myBeliefset.toPddlString(),
            "and (at me " + x + "_" + y + ")",
        );

        let problem = pddlProblem.toPddlString();
        console.log(problem);
        let domain = await readFile("domain.pddl");

        var plan = await onlineSolver(domain, problem);

        if (this.stopped) throw ["stopped"]; // if stopped then quit

        const pddlExecutor = new PddlExecutor({
            name: "go_to",
            executor: (l) => console.log("executor go_to " + l),
        });
        pddlExecutor.exec(plan);
    }
}

const planLibrary = [];

planLibrary.push(GoPickUp);
planLibrary.push(GoDeliver);
// planLibrary.push(DepthSearchMove)
planLibrary.push(BlindMove);
// planLibrary.push(PddlMove)

export {
    IntentionRevision,
    IntentionRevisionRevise,
    Intention,
    Plan,
    GoPickUp,
    BlindMove,
    PddlMove,
};
