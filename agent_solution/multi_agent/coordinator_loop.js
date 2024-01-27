import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import Communication from "../common_multi_agent/communication.js";

// Mattia
const client = new DeliverooApi("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk1ZTcxNWU2MmIxIiwibmFtZSI6Im1hdHRpYSIsImlhdCI6MTcwNTk2MzU1OX0.OwsNVldhSc2tIKBJoUy0ZgrltSt-2RoTzKvB1lPquxc");

client.onMsg((id, name, msg, reply) => Communication.Coordinator.handle(client, id, name, msg, reply));

// client.ask("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUxOTZiYjQzMTcyIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTcwNDEyMDMyN30.3AlvP4JKLYZxshw_p0Du0IHddBnZjELpOp-C4qBi0nw", "Hello world!");
