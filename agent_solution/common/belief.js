import { Agents } from "./agent.js";
import { distanceBetween } from "./helpers.js";
import Me from "./me.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";

class BeliefSet {
    static perceivedParcels = new Parcels();
    static perceivedAgents = new Agents();
    static map = null;
    static me = new Me();

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

    static updateConfig(config) {
        Config.MOVEMENT_DURATION = config.MOVEMENT_DURATION;
        Config.PARCEL_DECADING_INTERVAL =
            config.PARCEL_DECADING_INTERVAL == "1s" ? 1000 : 1000000;
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

    static getTargets() {
        let options = [];
        
        const parcels = this.getParcels();

        for (let p in parcels) {
            if (parcels[p].carriedBy === null) {
                // gain parcel = distance from me to parcel
                let score = 0;
                score += this.getMyReward(); // me carrying
                score += parcels[p].reward; // parcel reward
                const gonnaCarry = this.getCarriedByMe().length + 1;
                score -= gonnaCarry * this.getConfig().PARCEL_DECADING_INTERVAL / this.getConfig().MOVEMENT_DURATION * (distanceBetween(this.getMe(), parcels[p]) + distanceBetween(parcels[p], this.getClosestDeliverySpot(p)));
                options.push({
                    tile: this.getMap().getTile(parcels[p].x, parcels[p].y),
                    gain: score,
                });
            }
        }

        const deliverySpots = this.getMap().getDeliverySpots();

        for (let d in deliverySpots) {
            // gain parcel = distance from me to parcel
            let score = 0;
            score += this.getMyReward(); // me carrying
            const gonnaCarry = this.getCarriedByMe().length;
            score -= gonnaCarry * this.getConfig().PARCEL_DECADING_INTERVAL / this.getConfig().MOVEMENT_DURATION * distanceBetween(this.getMe(), deliverySpots[d]);
            options.push({
                tile: this.getMap().getTile(deliverySpots[d].x, deliverySpots[d].y),
                gain: score,
            });
        }

        return options.sort((a, b) => b.gain - a.gain);
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
            let distance = distanceBetween(tile, deliverySpots[d]);
            if (distance < closestDistance) {
                closestDeliverySpot = deliverySpots[d];
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
