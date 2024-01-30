import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import Communication from "../common_multi_agent/communication.js";
import {
    initMap,
    updateAgents,
    updateConfig,
    updateMe,
    updateParcels,
} from "./callbacks.js";
import Coordinator from "../common_multi_agent/coordinator.js";
import { sleep } from "../common_multi_agent/helpers.js";

// Mattia
const client = new DeliverooApi(
    "http://localhost:8080",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhmNjg4NTk5NDcwIiwibmFtZSI6ImdvZCIsImlhdCI6MTcwNjYwOTM2NH0.RYdwf01AMss2eIY0pNveMuS1VBc3rHrjxIhxJIeQC8Y",
);

client.onMsg((id, name, msg, reply) =>
    Communication.Coord.handle(client, id, name, msg, reply),
);

client.onMap((w, h, tiles) => initMap(w, h, tiles));
client.onParcelsSensing((parcels) => updateParcels(parcels));
client.onAgentsSensing((agents) => updateAgents(agents));
client.onYou((me) => updateMe(me));
client.onConfig((config) => updateConfig(config));

await sleep(100);

if (!Coordinator.isUpdatingBeliefs) {
    Coordinator.isUpdatingBeliefs = true;

    setInterval(() => {
        Coordinator.updateBeliefs();
    }, Coordinator.getConfig().PARCEL_DECADING_INTERVAL);
}

// client.ask("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUxOTZiYjQzMTcyIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTcwNDEyMDMyN30.3AlvP4JKLYZxshw_p0Du0IHddBnZjELpOp-C4qBi0nw", "Hello world!");
