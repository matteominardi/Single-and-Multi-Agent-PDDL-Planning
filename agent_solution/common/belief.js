import { Agents } from "./agent.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Me from "./me.js";

/**
 * Represents all the information the agent has about the world
 * @date 1/2/2024 - 3:34:40 PM
 *
 * @class BeliefSet
 * @typedef {BeliefSet}
 */
class BeliefSet {
    /**
     * Represents perceived parcels
     * @date 1/2/2024 - 3:15:56 PM
     *
     * @static
     * @type {Parcels}
     */
    static perceivedParcels = new Parcels();

    /**
     * Represents perceived agents
     * @date 1/2/2024 - 3:16:22 PM
     *
     * @static
     * @type {Agents}
     */
    static perceivedAgents = new Agents();

    /**
     * Represents the server map
     * @date 1/2/2024 - 3:16:38 PM
     *
     * @static
     * @type {TileMap | null}
     */
    static map = null;

    /**
     * Represents the agent itself
     * @date 1/2/2024 - 3:17:27 PM
     *
     * @static
     * @type {Me}
     */
    static me = new Me();

    /**
     * Get perceived parcels
     * @date 1/2/2024 - 3:17:57 PM
     *
     * @static
     * @returns {Parcels}
     */
    static getParcels() {
        return this.perceivedParcels;
    }

    /**
     * Update perceived parcels
     * @date 1/2/2024 - 3:18:16 PM
     *
     * @static
     * @param {*} parcels
     */
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

    /**
     * Get perceived agents
     * @date 1/2/2024 - 3:19:02 PM
     *
     * @static
     * @returns {Agents}
     */
    static getAgents() {
        return this.perceivedAgents;
    }

    /**
     * Update perceived agents
     * @date 1/2/2024 - 3:19:22 PM
     *
     * @static
     * @param {*} agents
     */
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

    /**
     * Get the server map
     * @date 1/2/2024 - 3:19:46 PM
     *
     * @static
     * @returns {*}
     */
    static getMap() {
        return this.map;
    }

    /**
     * Init map with width, height and tiles
     * @date 1/2/2024 - 3:20:07 PM
     *
     * @static
     * @param {number} width
     * @param {number} height
     * @param {Array} tiles
     */
    static initMap(width, height, tiles) {
        this.map = new TileMap(width, height, tiles);
    }

    /**
     * Update map content
     * @date 1/2/2024 - 3:21:05 PM
     *
     * @static
     * @param {number} x
     * @param {number} y
     * @param {boolean} delivery
     */
    static updateMap(x, y, delivery) {
        return;
    }

    /**
     * Get the agent itself
     * @date 1/2/2024 - 3:46:13 PM
     *
     * @static
     * @returns {Me}
     */
    static getMe() {
        return this.me;
    }

    static updateMe(id, name, x, y, score) {
        this.me.update(id, name, x, y, score);
    }
}

export default BeliefSet;
