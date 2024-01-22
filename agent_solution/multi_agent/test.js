import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk1ZTcxNWU2MmIxIiwibmFtZSI6Im1hdHRpYSIsImlhdCI6MTcwNTk2MzU1OX0.OwsNVldhSc2tIKBJoUy0ZgrltSt-2RoTzKvB1lPquxc");

client.onMsg(async (id, name, msg, reply) => {
    if (msg.message === "searching coordinator") {
        console.log(name, "is searching for a coordinator");
        if (reply) {
            reply(id, "I am the coordinator");
        } else {
            // console.log("no reply function")
            console.log(await client.ask(id, {"message":"I am the coordinator"}));
        }
    } else {
        console.log(name, "says", msg);
    }
});

// client.ask("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUxOTZiYjQzMTcyIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTcwNDEyMDMyN30.3AlvP4JKLYZxshw_p0Du0IHddBnZjELpOp-C4qBi0nw", "Hello world!");
