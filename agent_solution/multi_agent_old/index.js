import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
// import { onlineSolver, PddlDomain, PddlAction, PddlExecutor, PddlProblem, Planner, Beliefset } from "./config.js";§
import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "@unitn-asa/pddl-client";

// Planner.doPlan = onlineSolver;

const client = new DeliverooApi(
    "http://localhost:8080/", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcxZjY0NjU0NjE3IiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTY5ODc0NzUzNH0.V9bT6YrrS37wODxh1mP34Ezu6eXNdfEMnaGmjfzxyaI"
)

/**
 * Beliefset revision function
 */
const me = {};
// client.onYou( ( {id, name, x, y, score} ) => {
//     me.id = id
//     me.name = name
//     me.x = x
//     me.y = y
//     me.score = score
// } )

// print whenever client do a request
client.onYou(async (info) => {
    if (info.x % 1 != 0 || info.y % 1 != 0) return;
    console.log("You", info);
});

const myBeliefset = new Beliefset();

client.onMap((w, h, tiles) => {
    for (let {x, y, delivery} of tiles) {
        myBeliefset.declare( 'tile '+x+'_'+y );
        if (delivery)
        myBeliefset.declare( 'delivery '+x+'_'+y );
    let right = tiles.find( (_x,_y) => x== _x+1 && y==_y );
    if ( right ) {
        myBeliefset.declare( 'right '+x+'_'+y+' '+right.x+'_'+right.y+' ' )
    }
}
})

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

const db_parcels = new Map()
client.socket.on("parcels sensing", ( parcels ) => {
    const options = [] //vorrei fare che le options venissero memorizzate sempre nell'agent, non solo quando si muove e trova nuove parcels
    let best_option = null;
    let nearest = Number.MAX_VALUE;

    for (const p of parcels) {
        if (!db_parcels.has(p.id)) {
            db_parcels.set( p.id, [])
        }
        const history = db_parcels.get(p.id)
        const last = history[history.length-1]
        
        if ( !last || last.x != p.x || last.y != p.y || last.carriedBy != p.carriedBy) 
            history.push( {x: p.x, y: p.y, reward: p.reward, carriedBy: p.carriedBy} )
    
        if (!p.carriedBy)
            options.push( [ 'go_pick_up', p.x, p.y, p.id ] );
            // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

        console.log("Parcel " + p.id + " with reward " + p.reward + " is at " + p.x + " " + p.y + " and is carried by " + p.carriedBy)
    }
    

    for (const option of options) {
        if ( option[0] == 'go_pick_up' ) {
            let [go_pick_up,x,y,id] = option;
            let current_d = distance( {x, y}, me )
            if ( current_d < nearest ) {
                best_option = option
                nearest = current_d
                console.log("Best option is " + best_option + " with distance " + nearest)
            }
        }
    }

    if ( best_option ) // Best option is selected
        myAgent.push( best_option )
} )

// PER ORA NON SERVE PERCHE' NON SIAMO IN MULTI AGENT
// const db_agents = new Map()
// client.socket.on("agents sensing", (agents) => {
//     for (const a of agents) {
//         if (a.x % 1 != 0 || a.y % 1 != 0) // skip intermediate values (0.6 or 0.4)
//             continue;

//         if (!db_agents.has(a.id)) {
//             db_agents.set(a.id, [a])
//             console.log("Hello", a.name)
//         } else { 
//             const history = db_agents.get(a.id)
//             const last = history[history.length-1]
//             const second_last = (history.length>2 ? history[history.length-2] : "no knowledge")
            
//             if (last != "lost") { // I was seeing him also last time
//                 if (last.x != a.x || last.y != a.y) { // But he moved
//                     history.push(a)
//                     console.log("I'm seeing you moving", a.name)                
//                 } else { // Still here but not moving
//                 }           
//             } else { // I see him again after some time
//                 history.push(a)

//                 if (second_last.x != a.x || second_last.y != a.y) {
//                     console.log("Welcome back, seems that you moved", a.name)
//                 } else {
//                     console.log("Welcome back, seems you are still here as before", a.name)
//                 }
//             }
//         }
//     }

//     for (const [id,history] of db_agents.entries()) {
//         const last = history[history.length-1]
//         const second_last = (history.length>1 ? history[history.length-2] : "no knowledge")

//         if (!agents.map(a=>a.id).includes(id)) {
//             // If I am not seeing him anymore
            
//             if (last != "lost") {
//                 // Just went off
//                 history.push("lost");
//                 console.log("Bye", last.name);
//             } else {
//                 // A while since last time I saw him

//                 console.log("Its a while that I don't see", second_last.name, "I remember him in", second_last.x, second_last.y);
                
//                 if ( distance(me, second_last) <= 3 ) {
//                     console.log("I remember", second_last.name, "was within 3 tiles from here. Forget him.");
//                     db_agents.delete(id)
//                 }
//             }
//         } else { // If I am still seing him ... see above
//             // console.log( 'still seing him', last.name )
//         }
//     }
// } )


class IntentionRevision {
    #intention_queue = new Array();
    
    get intention_queue () {
        return this.#intention_queue;
    }
    
    log ( ...args ) {
        console.log( ...args )
    }

    async loop ( ) {
        while ( true ) {
            if ( this.intention_queue.length > 0 ) {
                console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
            
                // Current intention
                const intention = this.intention_queue[0];
                
                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                let id = intention.predicate[2]
                let p = parcels.get(id)
                if ( p && p.carriedBy ) {
                    console.log( 'Skipping intention because no more valid', intention.predicate )
                    continue;
                }

                // Start achieving intention
                await intention.achieve().catch( error => {
                    // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                } );

                this.intention_queue.shift();
            }
            
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }
}

// class IntentionRevisionReplace extends IntentionRevision {
//     async push (predicate) {
//         // Check if already queued
//         const last = this.intention_queue.at( this.intention_queue.length - 1 );
        
//         if ( last && last.predicate.join(' ') == predicate.join(' ') )
//             return; // intention is already being achieved        
        
//         console.log( 'IntentionRevisionReplace.push', predicate );
//         const intention = new Intention( this, predicate );
//         this.intention_queue.push( intention );
        
//         if (last)
//             last.stop();
//     }
// }

class IntentionRevisionRevise extends IntentionRevision {

    async push ( predicate ) {
        console.log( 'Revising intention queue. Received', ...predicate );
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
    }

}

const myAgent = new IntentionRevisionRevise();
myAgent.loop();

class Intention {
    #current_plan; // Plan currently used for achieving the intention 
    #stopped = false; // This is used to stop the intention
    #parent; // #parent refers to caller
    #predicate; // will be in the form ['go_to', x, y] 
    #started = false;
    
    constructor ( parent, predicate ) {
        this.#parent = parent;
        this.#predicate = predicate;
    }
    
    get predicate () {
        return this.#predicate;
    }

    get stopped () {
        return this.#stopped;
    }

    stop () {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    async achieve () {
        if (this.#started)
            return this; // Cannot start twice
        
        this.#started = true;

        for (const planClass of planLibrary) {
            if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

            if ( planClass.isApplicableTo( ...this.predicate ) ) {
                this.#current_plan = new planClass(this.parent);
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                
                try {
                    const plan_res = await this.#current_plan.execute( ...this.predicate );
                    this.log( 'succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res );
                    return plan_res
                } catch (error) {
                    this.log( 'failed intention', ...this.predicate,'with plan', planClass.name, 'with error:', ...error );
                }
            }
        }

        if (this.stopped) 
            throw [ 'stopped intention', ...this.predicate ];
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ['no plan satisfied the intention ', ...this.predicate ]
    }
}

const planLibrary = [];

class Plan {
    #sub_intentions = []; // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #stopped = false;
    #parent;

    constructor ( parent ) {
        this.#parent = parent;
    }

    get stopped () {
        return this.#stopped;
    }

    stop () {
        this.log( 'stop plan' );
        this.#stopped = true;
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }
    
    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    async subIntention ( predicate ) {
        const sub_intention = new Intention( this, predicate );
        this.#sub_intentions.push( sub_intention );
        return await sub_intention.achieve();
    }
}

class GoPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE
        await this.subIntention( ['go_to', x, y] );
        if ( this.stopped ) throw ['stopped']; 
        await client.pickup()
        if ( this.stopped ) throw ['stopped']; 

        return true;
    }
}

class BlindMove extends Plan {
    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {
        while ( me.x != x || me.y != y ) {
            // if ( this.stopped ) throw ['stopped']; SECONDO ME FORSE NON SERVE 
            let status_x = false;
            let status_y = false;
            
            if ( x > me.x )
                status_x = await client.move('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( x < me.x )
                status_x = await client.move('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                // me.y = status_x.y; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
            }

            if ( this.stopped ) throw ['stopped']; 

            if ( y > me.y )
                status_y = await client.move('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( y < me.y )
                status_y = await client.move('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                // me.x = status_y.x; NON CREDO SERVA VISTO CHE NON CAMBIA IN TEORIA
                me.y = status_y.y;
            }

            if ( this.stopped ) throw ['stopped'];
            
            if (!status_x && !status_y) {
                this.log('stucked');
                throw 'stucked';
            }          
        }

        return true;
    }
}

class PddlMove extends Plan {
    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {
        var pddlProblem = new PddlProblem(
            'domain',
            myBeliefset.objects.join(' '),
            myBeliefset.toPddlString(),
            'and (at me '+x+'_'+y+')'
        )
        
        let problem = pddlProblem.toPddlString();
        console.log( problem );
        let domain = await readFile('domain.pddl');
    
        var plan = await onlineSolver( domain, problem );

        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        
        const pddlExecutor = new PddlExecutor( { name: 'go_to', executor: (l) => console.log('executor go_to '+l) } );
        pddlExecutor.exec( plan );
    }
}

planLibrary.push(GoPickUp)
planLibrary.push(BlindMove)
planLibrary.push(PddlMove)