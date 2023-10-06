import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlZjk2NjdmZWNjIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTY5NjU5NTQyOH0.yRlC_y5Tr7YEEFDt_dLyx0CfGV2Kkx000q2pt8esvcw'
)

async function myFn () {

    let up = await client.move('up');
    let right = await client.move('right');
    
}

// myFn ()

client.socket.on( 'tile', (x, y, delivery) => {
    console.log(x, y, delivery)
} )

/**
 * 28/03/2023
 * 
 * Implement an agent that:
 * - moves along a predefined path
 * - pick the parcel
 * - deliver it
 * 
 * What if other agents are moving?
 * - Dealing with failing actions, by insisting on path.
 */