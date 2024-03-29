import { Agents } from "./agent.js";
import { distanceBetween } from "./helpers.js";
import Me from "./me.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Config from "./config.js";

class BeliefSet {
    static perceivedParcels = new Parcels();
    static ignoredParcels = new Parcels();
    static ignoredTiles = [];
    static perceivedAgents = new Agents();
    static deliverySpots = [];
    static map = null;
    static me = new Me();

    static getParcels() {
        let parcels = new Parcels();
        let perceivedParcels = Array.from(this.perceivedParcels);

        perceivedParcels = perceivedParcels.filter(parcel =>
            !this.ignoredTiles.some(tile => tile.x === parcel.x && tile.y === parcel.y)
        );

        for (let parcel of perceivedParcels) {
            parcel.x = Math.round(parcel.x);
            parcel.y = Math.round(parcel.y);

            const isOnDeliverySpot = BeliefSet.deliverySpots.some(
                (spot) => spot.x === parcel.x && spot.y === parcel.y,
            );

            if (
                parcel.carriedBy === this.getMe().id ||
                (!isOnDeliverySpot && this.shouldConsiderParcel(parcel.id))
            ) {
                parcels.addParcel(parcel);
            }
        }

        return parcels;
    }

    static computeDeliverySpots() {
        BeliefSet.deliverySpots = this.map.getDeliverySpots();
    }

    static checkTileReachable(goalTile) {
        let path = Me.pathTo(goalTile);
        return path.status === "success";
    }

    static updateParcels(parcels) {
        for (let p in parcels) {
            if (this.shouldConsiderParcel(parcels[p].id)) {
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
    }

    static shouldConsiderParcel(parcelId) {
        return this.ignoredParcels.getParcel(parcelId) === null;
    }

    static decayParcelsReward() {
        const decay = 1000 / BeliefSet.getConfig().PARCEL_DECADING_INTERVAL;
        for (let parcel of Array.from(this.perceivedParcels)) {
            if (
                this.shouldConsiderParcel(parcel.id) &&
                parcel.carriedBy === null
            ) {
                parcel.reward -= decay;
                if (parcel.reward <= 0) {
                    this.removeParcel(parcel.id);
                }
            }
        }
    }

    static removeParcel(parcelId) {
        this.ignoredParcels.addParcel(
            this.perceivedParcels.getParcel(parcelId),
        );
    }

    static updateConfig(config) {
        Config.MOVEMENT_DURATION = config.MOVEMENT_DURATION;
        if (config.PARCEL_DECADING_INTERVAL === "infinite") {
            Config.PARCEL_DECADING_INTERVAL = Infinity;
        } else {
            Config.PARCEL_DECADING_INTERVAL =
                parseInt(config.PARCEL_DECADING_INTERVAL.slice(0, -1)) * 1000;
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
        this.perceivedAgents = new Agents();
        
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
        this.getMe().update(me);
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
        for (let d in BeliefSet.deliverySpots) {
            const deliveryTile = this.getMap().getTile(
                BeliefSet.deliverySpots[d].x,
                BeliefSet.deliverySpots[d].y,
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
