import { Agents } from "./agent.js";
import { distanceBetween } from "./helpers.js";
import Me from "./me.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Config from "./config.js";

class BeliefSet {
    static perceivedParcels = new Parcels();
    static perceivedAgents = new Agents();
    static map = null;
    static me = new Me();

    static getParcels() {
        let parcels = new Parcels();
        let perceivedParcels = Array.from(this.perceivedParcels);
        let deliverySpots = this.map.getDeliverySpots();
        
        for (let parcel of perceivedParcels) {
            const isCoordinateMatch = deliverySpots.some(
                spot => spot.x === parcel.x && spot.y === parcel.y
            );
        
            if (parcel.carriedBy === BeliefSet.me.id || !isCoordinateMatch) {
                parcels.addParcel(parcel);
            }
        }

        return parcels;
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

    static removeParcel(parcelId) {
        this.perceivedParcels.deleteParcel(parcelId);
    }

    static updateConfig(config) {
        Config.MOVEMENT_DURATION = config.MOVEMENT_DURATION;
        if (config.PARCEL_DECADING_INTERVAL === "infinite") {
            Config.PARCEL_DECADING_INTERVAL = 1;
        } else {
            Config.PARCEL_DECADING_INTERVAL = parseInt(
                config.PARCEL_DECADING_INTERVAL.slice(0, -1),
            );
        }
    }

    static setCarriedByMe(parcelId) {
        this.getParcels().setCarriedBy(parcelId, this.getMe().id);
    }

    static emptyCarriedByMe() {
        this.getParcels().emptyCarriedBy(this.getMe().id);
    }

    static getCarriedByMe() {
        return this.getParcels().getCarriedBy(this.getMe().id);
    }

    static getMyReward() {
        return this.getParcels().getRewardBy(this.getMe().id);
    }

    static getAgents() {
        return this.perceivedAgents;
    }

    static getConfig() {
        return Config;
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
        return this.me;
    }

    static updateMe(me) {
        BeliefSet.me.update(me);
    }

    static isParcel(tile) {
        return this.getParcels().forEach((parcel) => {
            if (parcel.x === tile.x && parcel.y === tile.y) {
                return true;
            }
        });
    }

    static getClosestParcel(tile) {
        let closestParcel = null;
        let closestDistance = Infinity;
        this.perceivedParcels.forEach((parcel) => {
            if (parcel.carriedBy === null) {
                const parcelTile = this.getMap().getTile(parcel.x, parcel.y);
                let distance = distanceBetween(tile, parcelTile);
                if (distance < closestDistance) {
                    closestParcel = parcelTile;
                    closestDistance = distance;
                }
            }
        });
        return closestParcel;
    }

    static getClosestDeliverySpot(tile) {
        let closestDeliverySpot = null;
        let closestDistance = Infinity;
        let deliverySpots = this.map.getDeliverySpots();
        for (let d in deliverySpots) {
            const deliveryTile = this.getMap().getTile(
                deliverySpots[d].x,
                deliverySpots[d].y,
            );
            let distance = distanceBetween(tile, deliveryTile);
            if (distance < closestDistance) {
                closestDeliverySpot = deliveryTile;
                closestDistance = distance;
            }
        }
        return closestDeliverySpot;
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
