import { Agents } from "./agent.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Me from "./me.js";

class BeliefSet {
    static perceivedParcels = new Parcels();
    static perceivedAgents = new Agents();
    static map = null;
    static me = null;

    static getParcels() {
        return this.perceivedParcels;
    }

    static updateParcels(parcels) {
        for (let p in parcels) {
            // check if id already present
            if (this.perceivedParcels.getParcel(parcels[p].id) !== null) {
                // update parcel
                this.perceivedParcels.updateParcel(parcels[p]);
            } else {
                // add parcel
                this.perceivedParcels.addParcel(parcels[p]);
            }
        }
    }

    static getAgents() {
        return this.perceivedAgents;
    }

    static updateAgents(agents) {
        for (let a in agents) {
            // check if id already present
            if (this.perceivedAgents.getAgent(agents[a].id) !== null) {
                // update parcel
                this.perceivedAgents.updateAgent(agents[a]);
            } else {
                // add parcel
                this.perceivedAgents.addAgent(agents[a]);
            }
        }
    }

    static getMap() {
        return this.map;
    }

    static initMap(width, height, tiles) {
        BeliefSet.map = new TileMap(width, height, tiles);
    }

    static updateMap(x, y, delivery) {
        return;
    }

    static getMe() {
        return new Me(Me.id, Me.name, Me.last_x, Me.last_y, Me.score);
    }

    static updateMe(me) {
        BeliefSet.me.update(me);
    }

    static getBeliefs() {
        return {
            parcels: BeliefSet.getParcels(),
            agents: BeliefSet.getAgents(),
            map: BeliefSet.getMap(),
            me: BeliefSet.getMe(),
        };
    }
}

export default BeliefSet;
