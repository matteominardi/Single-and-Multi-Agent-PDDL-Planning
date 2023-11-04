class IntentionRevision {
    #intention_queue = new Array();

    get intention_queue() {
        return this.#intention_queue;
    }

    log(...args) {
        console.log(...args)
    }

    async loop() {
        while (true) {
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));

                // Current intention
                const intention = this.intention_queue[0];

                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                let id = intention.predicate[2]
                let p = parcels.get(id)
                if (p && p.carriedBy) {
                    console.log('Skipping intention because no more valid', intention.predicate)
                    continue;
                }

                // Start achieving intention
                await intention.achieve().catch(error => {
                    // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                });

                this.intention_queue.shift();
            }

            // Postpone next iteration at setImmediate
            await new Promise(res => setImmediate(res));
        }
    }
}

class IntentionRevisionRevise extends IntentionRevision {

    async push(predicate) {
        console.log('Revising intention queue. Received', ...predicate);
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
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
        if (this.#current_plan)
            this.#current_plan.stop();
    }

    log(...args) {
        if (this.#parent && this.#parent.log)
            this.#parent.log('\t', ...args)
        else
            console.log(...args)
    }

    async achieve() {
        if (this.#started)
            return this; // Cannot start twice

        this.#started = true;

        for (const planClass of planLibrary) {
            if (this.stopped) throw ['stopped intention', ...this.predicate];

            if (planClass.isApplicableTo(...this.predicate)) {
                this.#current_plan = new planClass(this.parent);
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);

                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate);
                    this.log('succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res);
                    return plan_res
                } catch (error) {
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', ...error);
                }
            }
        }

        if (this.stopped)
            throw ['stopped intention', ...this.predicate];
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ['no plan satisfied the intention ', ...this.predicate]
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
        this.log('stop plan');
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }

    log(...args) {
        if (this.#parent && this.#parent.log)
            this.#parent.log('\t', ...args)
        else
            console.log(...args)
    }

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }
}

class GoPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == 'go_pick_up';
    }

    async execute(go_pick_up, x, y) {
        // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped'];
        await client.pickup()
        if (this.stopped) throw ['stopped'];

        return true;
    }
}

class BlindMove extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, x, y) {
        while (me.x != x || me.y != y) {
            // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE 
            let status_x = false;
            let status_y = false;

            if (x > me.x)
                status_x = await client.move('right')
            // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if (x < me.x)
                status_x = await client.move('left')
            // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                // me.y = status_x.y; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
            }

            if (this.stopped) throw ['stopped'];

            if (y > me.y)
                status_y = await client.move('up')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if (y < me.y)
                status_y = await client.move('down')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                // me.x = status_y.x; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
                me.y = status_y.y;
            }

            if (this.stopped) throw ['stopped'];

            if (!status_x && !status_y) {
                this.log('stucked');
                throw 'stucked';
            }
        }

        return true;
    }
}

class PddlMove extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, x, y) {
        var pddlProblem = new PddlProblem(
            'domain',
            myBeliefset.objects.join(' '),
            myBeliefset.toPddlString(),
            'and (at me ' + x + '_' + y + ')'
        )

        let problem = pddlProblem.toPddlString();
        console.log(problem);
        let domain = await readFile('domain.pddl');

        var plan = await onlineSolver(domain, problem);

        if (this.stopped) throw ['stopped']; // if stopped then quit

        const pddlExecutor = new PddlExecutor({ name: 'go_to', executor: (l) => console.log('executor go_to ' + l) });
        pddlExecutor.exec(plan);
    }
}

export { IntentionRevision, IntentionRevisionRevise, Intention, Plan, GoPickUp, BlindMove, PddlMove };