import { Agents } from "./agent.js";
import { distanceBetween } from "./helpers.js";
import Me from "./me.js";
import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Config from "./config.js";
import { PddlProblem } from "@unitn-asa/pddl-client";

class BeliefSet {
    static perceivedParcels = new Parcels();
    static ignoredParcels = new Parcels();
    static perceivedAgents = new Agents();
    static map = null;
    static me = new Me();

    static getParcels() {
        let parcels = new Parcels();
        let perceivedParcels = Array.from(this.perceivedParcels);
        let deliverySpots = this.map.getDeliverySpots();

        for (let parcel of perceivedParcels) {
            parcel.x = Math.round(parcel.x);
            parcel.y = Math.round(parcel.y);

            const isOnDeliverySpot = deliverySpots.some(
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
        // this.perceivedParcels.deleteParcel(parcelId);
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
        for (let a in agents) {
            // check if id already present
            if (this.perceivedAgents.getAgent(agents[a].id) !== null) {
                // update agent
                this.perceivedAgents.updateAgent(agents[a]);
            } else {
                // add agent
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

    static toPddl(target) {
        let objects = [];
        const mapPddl = this.getMap().toPddl(); // it is a map of xiyj to array of strings
        // console.log(mapPddl);
        const agentsPddl = this.getAgents().getAll();
        agentsPddl.forEach(function (key) {
            const infos = mapPddl.get(key);
            // search string that starts with (available and replace it with
            // `(not (available x${i}y${j}))`
            const available = infos.find((info) =>
                info.startsWith("(available"),
            );
            const index = infos.indexOf(available);
            infos[index] = `(not ${available})`;
            mapPddl.set(key, infos);
        });

        const parcelsPddl = this.getParcels().toPddl();
        parcelsPddl.forEach(function (parcel, key, map) {
            // iterate over parcel and search the one that starts with (parcel, take everything until the end-1
            const parcelInfo = parcel.find((info) =>
                info.startsWith("(parcel"),
            );
            // get everything after the first space and before the last )
            const parcelInfoIndex = parcel.indexOf(parcelInfo);
            let parcelInfoId = parcel[parcelInfoIndex];
            parcelInfoId = parcelInfoId.substring(
                parcelInfoId.indexOf(" ") + 1,
                parcelInfoId.lastIndexOf(")"),
            );
            objects.push(`${parcelInfoId}`);
            let infos = mapPddl.get(key);
            infos = infos.concat(parcel);
            mapPddl.set(key, infos);
        });

        const mePddl = this.getMe().toPddl();

        let init = [];
        init = init.concat(mePddl);
        objects.push(`me${this.getMe().id}`);

        mapPddl.forEach(function (infos, key, map) {
            objects.push(`${key}`);
            init = init.concat(infos);
        });

        const goal = `at me${this.getMe().id} x${target.tile.x}y${
            target.tile.y
        }`;

        const problemPddl = new PddlProblem(
            "prova",
            objects.join(" "),
            init.join(" "),
            goal,
        );

        return problemPddl;
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
