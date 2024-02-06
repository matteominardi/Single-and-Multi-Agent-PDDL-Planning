import aStar from "a-star";
import BeliefSet from "./belief.js";
import Communication from "./communication.js";
import Config from "./config.js";
import { Desire } from "./desires.js";
import { hash } from "./helpers.js";
import { Parcel, Parcels } from "./parcel.js";
import { TileMap, TileType } from "./world.js";

class Coordinator {
    static map = null;
    static agents = new Map(); // used to store the position of the known agents
    static currentAgentGoal = null;
    static ignoredParcels = new Map(); // used to store the parcels that should not be considered anymore
    static deliverySpots = []; // used to store the delivery spots
    static ignoredTiles = []; // used to store the tiles that are not reachable 
    static allPerceivedParcels = []; // used to store all the perceived parcels by all agents
    static allPerceivedAgents = []; // used to store all the perceived agents by all agents
    static allIntentions = []; // used to store all the intentions of all agents
    static isUpdatingBeliefs = false;

    static getConfig() {
        return Config;
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

    static updateBeliefs() {
        Coordinator.decayParcelsReward();
    }

    static getMap() {
        return Coordinator.map;
    }

    static initMap(width, height, tiles) {
        Coordinator.map = new TileMap(width, height, tiles);
    }

    static equalsIntention(intentionDesireA, intentionDesireB) {
        return (
            intentionDesireA.tile.x === intentionDesireB.tile.x &&
            intentionDesireA.tile.y === intentionDesireB.tile.y
        );
    }

    static hasAgent(agentId) {
        return Coordinator.agents.has(agentId);
    }

    static updateAgent(agentId, info) {
        Coordinator.agents.set(agentId, info);

        if (!Coordinator.ignoredParcels.has(agentId)) {
            Coordinator.ignoredParcels.set(agentId, new Parcels());
        }
    }

    static addPerceivedParcels(perceivedParcels) {
        for (const parcel of perceivedParcels) {
            const parcelIndex = Coordinator.allPerceivedParcels.findIndex(
                (p) => p.id === parcel.id,
            );

            if (parcelIndex === -1) {
                Coordinator.allPerceivedParcels.push(parcel);
            } else {
                Coordinator.allPerceivedParcels[parcelIndex] = parcel;
            }
        }
    }

    static removeParcel(agentId, parcelId) {
        const parcelIndex = Coordinator.allPerceivedParcels.findIndex(
            (p) => p.id === parcelId,
        );

        if (parcelIndex !== -1) {
            let parcels = Coordinator.ignoredParcels.get(agentId);
            parcels.addParcel(
                new Parcel(
                    parcelId,
                    Coordinator.allPerceivedParcels[parcelIndex].x,
                    Coordinator.allPerceivedParcels[parcelIndex].y,
                    Coordinator.allPerceivedParcels[parcelIndex].carriedBy,
                    Coordinator.allPerceivedParcels[parcelIndex].reward,
                )
            );
            Coordinator.ignoredParcels.set(agentId, parcels);
        }

        Coordinator.allPerceivedParcels = Coordinator.allPerceivedParcels.filter(
            (p) => p.id !== parcelId,
        );
    }

    static ignoreOpponentsParcels() {
        for (const agent of Coordinator.allPerceivedAgents) {
            if (agent.name !== "god" && !Coordinator.hasAgent(agent.id)) {
                for (const parcel of Coordinator.allPerceivedParcels) {
                    if (
                        (parcel.carriedBy === null && 
                            parcel.x === agent.x && parcel.y === agent.y) || 
                        (parcel.carriedBy === agent.id)
                    ) {
                        for (const teamAgentId of Coordinator.agents.keys()) {
                            Coordinator.removeParcel(teamAgentId, parcel.id);
                        }
                    }
                }
            }
        }
    }

    static removeDeliveryIntentions(agentId) {
        Coordinator.allIntentions = Coordinator.allIntentions.filter(
            (i) => i.agentId !== agentId || i.intention.tile.type !== TileType.DELIVERY,
        );
    }

    static shouldConsiderParcel(agentId, parcelId) {
        let parcels = Coordinator.ignoredParcels.get(agentId);
        return parcels.getParcel(parcelId) === null;
    }

    static addPerceivedAgents(perceivedAgents) {
        for (const agent of perceivedAgents) {
            const agentIndex = Coordinator.allPerceivedAgents.findIndex(
                (a) => a.id === agent.id,
            );

            if (agentIndex === -1) {
                Coordinator.allPerceivedAgents.push(agent);
            } else {
                Coordinator.allPerceivedAgents[agentIndex] = agent;
            }
        }
    }

    static getAllPerceivedAgents() {
        return Coordinator.allPerceivedAgents;
    }

    static computeAllDesires() {
        for (let agentId of Coordinator.agents.keys()) {
            Coordinator.computeAgentDesires(agentId);
        }
    }

    static computeAgentDesires(agentId) {
        let options = [];

        for (let p in Coordinator.allPerceivedParcels) {
            if (
                Coordinator.shouldConsiderParcel(agentId, Coordinator.allPerceivedParcels[p].id) &&
                Coordinator.allPerceivedParcels[p].carriedBy === null
            ) {
                let score = Coordinator.computeParcelGain(
                    agentId,
                    Coordinator.allPerceivedParcels[p],
                );
                if (score > 0) {
                    options.push(
                        new Desire(
                            Coordinator.getMap().getTile(
                                Coordinator.allPerceivedParcels[p].x,
                                Coordinator.allPerceivedParcels[p].y,
                            ),
                            score,
                            Coordinator.allPerceivedParcels[p],
                        ),
                    );
                }
            }
        }

        const parcelsViewed = options.length;

        const deliverySpots = Coordinator.getDeliverySpots();

        for (let d in deliverySpots) {
            let score = Coordinator.computeDeliveryGain(agentId, deliverySpots[d]);

            if (score > 0) {
                options.push(
                    new Desire(
                        Coordinator.getMap().getTile(
                            deliverySpots[d].x,
                            deliverySpots[d].y,
                        ),
                        score,
                        null
                    ),
                );
            }
        }

        if (parcelsViewed === 0 && Coordinator.getCarriedBy(agentId).length === 0) {
            options.push(new Desire(Coordinator.getRandomTile(), 1));
        }

        options = options.filter((o) =>
            !Coordinator.ignoredTiles.some((tile) => tile.x === o.tile.x && tile.y === o.tile.y)
        );
        
        Coordinator.addAgentIntentions(agentId, options);
    }

    static computeParcelGain(agentId, parcel) {
        let score = 0;

        const gonnaCarry = Coordinator.getCarriedBy(agentId).length + 1; // agentId + parcel
        const factor =
            0.01 +
            Coordinator.getConfig().MOVEMENT_DURATION /
            Coordinator.getConfig().PARCEL_DECADING_INTERVAL;

        const agentPosition = {
            x: Math.round(Coordinator.agents.get(agentId).last_x),
            y: Math.round(Coordinator.agents.get(agentId).last_y),
        };

        const parcelDistance = Coordinator.distanceBetween(
            agentPosition,
            Coordinator.getMap().getTile(parcel.x, parcel.y),
        );
        
        const closestDeliverySpotDistance = Coordinator.distanceBetween(
            Coordinator.getMap().getTile(parcel.x, parcel.y),
            Coordinator.getClosestDeliverySpot(parcel),
        );
        score += Coordinator.getAgentReward(agentId); // agentId carrying
        score += parcel.reward; // parcel reward
        score -= factor * parcelDistance;
        score -= gonnaCarry * factor * closestDeliverySpotDistance; // me + parcels decading

        return score;
    }

    static getDeliverySpots() {
        // const deliverySpots = [];
        // for (let x = 0; x < BeliefSet.getMap().width; x++) {
        //     for (let y = 0; y < BeliefSet.getMap().height; y++) {
        //         const tile = BeliefSet.getMap().tiles[x][y];
        //         console.log("tile", tile);
        //         if (tile.type === TileType.DELIVERY) {
        //             deliverySpots.push(tile);
        //         }
        //     }
        // }
        // console.log("deliverySpots", deliverySpots);
        // return deliverySpots;
        return Coordinator.deliverySpots;
    }

    static getClosestDeliverySpot(parcel) {
        let tile = Coordinator.getMap().getTile(parcel.x, parcel.y);
        let closestDeliverySpot = null;
        let closestDistance = Infinity;
        let deliverySpots = Coordinator.getDeliverySpots();
        for (let d in deliverySpots) {
            const deliveryTile = this.getMap().getTile(
                deliverySpots[d].x,
                deliverySpots[d].y,
            );
                
            let ignoredTileIndex = Coordinator.ignoredTiles.findIndex(
                (t) => t.x === deliveryTile.x && t.y === deliveryTile.y,
            );

            if (ignoredTileIndex !== -1) {
                continue;
            }
            
            let distance = Coordinator.distanceBetween(tile, deliveryTile);
            if (distance < closestDistance) {
                closestDeliverySpot = deliveryTile;
                closestDistance = distance;
            }
        }
        return closestDeliverySpot;
    }

    static computeDeliveryGain(agentId, deliverySpot) {
        let score = 0;

        const gonnaCarry = Coordinator.getCarriedBy(agentId).length;
        const factor =
            0.01 +
            Coordinator.getConfig().MOVEMENT_DURATION /
            Coordinator.getConfig().PARCEL_DECADING_INTERVAL;
        const agentPosition = {
            x: Math.round(Coordinator.agents.get(agentId).last_x),
            y: Math.round(Coordinator.agents.get(agentId).last_y),
        };
        const distance = Coordinator.distanceBetween(agentPosition, deliverySpot);
        score += Coordinator.getAgentReward(agentId); // agentId carrying
        score -= gonnaCarry * factor * distance; // me + parcel decading

        return score;
    }

    static distanceBetween(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    static getCarriedBy(agentId) {
        let parcels = [];
        for (let p of Coordinator.allPerceivedParcels) {
            if (p.carriedBy === agentId) {
                parcels.push(p);
            }
        }
        return parcels;
    }

    static getAgentReward(agentId) {
        let carriedParcels = Coordinator.getCarriedBy(agentId);
        let reward = 0;
        for (let p of carriedParcels) {
            if (Coordinator.shouldConsiderParcel(agentId, p.id)) {
                reward += p.reward;
            }
        }
        return reward;
    }

    static ackParcel(parcelId) {
        for (const agentId in Coordinator.agents.keys()) {
            if (Coordinator.shouldConsiderParcel(agentId, parcelId)) {
                return true;
            }
        }
        return false;
    }

    static decayParcelsReward() {
        const decay = 1;

        for (let parcel of Coordinator.allPerceivedParcels) {
            if (
                Coordinator.ackParcel(parcel.id)
            ) {
                parcel.reward -= decay;
                if (parcel.reward <= 1) {
                    for (const agentId of Coordinator.agents.keys()) {
                        Coordinator.removeParcel(agentId, parcel.id);
                    }
                }
            }
        }

        Coordinator.decayAllIntentionGains();
    }

    static decayAllIntentionGains() {
        for (let intention of Coordinator.allIntentions) {
            if (intention.intention.parcel && !intention.forcedDelivery) {
                intention.intention.gain = Coordinator.computeParcelGain(
                    intention.agentId,
                    intention.intention.parcel,
                );
            } else {
                if (
                    intention.intention.tile.type === TileType.DELIVERY ||
                    intention.forcedDelivery
                ) {
                    intention.intention.gain = Coordinator.computeDeliveryGain(
                        intention.agentId,
                        intention.intention.tile,
                    );
                }
            }
        }

        Coordinator.filterAllIntentionGains();
    }

    static filterAllIntentionGains() {
        Coordinator.allIntentions = Coordinator.allIntentions.filter(
            (d) => d.intention.gain > 0,
        );
    }

    static addAgentIntentions(agentId, agentDesires) {
        for (const desire of agentDesires) {
            const intentionIndex = Coordinator.allIntentions.findIndex(
                (i) =>
                    i.agentId === agentId &&
                    Coordinator.equalsIntention(i.intention, desire),
            );

            if (
                intentionIndex === -1 &&
                !Coordinator.isAlreadyActiveIntention(agentId, desire)
            ) {
                Coordinator.allIntentions.push({
                    agentId: agentId,
                    intention: desire,
                    isActive: false,
                });
            } else {
                if (intentionIndex !== -1) {
                    console.log("Intention already present", desire, Coordinator.allIntentions[intentionIndex])
                    Coordinator.allIntentions[intentionIndex].intention.gain = desire.gain;
                }
            }
        }

        if (Coordinator.allIntentions.length > 1) {
            Coordinator.allIntentions = Coordinator.allIntentions.filter(
                (intention) => intention.intention.gain > 1
            );
        }
    }

    static getAgentIntentions(agentId) {
        return Coordinator.allIntentions.filter((i) => i.agentId === agentId);
    }

    static isAlreadyActiveIntention(agentId, intention) {
        let res = false;

        const intentionIndex = Coordinator.allIntentions.findIndex(
            (i) =>
                i.agentId !== agentId &&
                Coordinator.equalsIntention(i.intention, intention) &&
                i.isActive === true
        );

        if (intentionIndex !== -1) {
            res = true;
        }

        return res;
    }

    static async getBestCoordinatedIntention(client, agentId) {
        Coordinator.coordinateIntentions();
        
        const intention = Coordinator.allIntentions.find(
            (i) =>
                i.isActive === false &&
                i.agentId === agentId &&
                !Coordinator.isAlreadyActiveIntention(agentId, i.intention),
        );

        // console.log("\n\ngetBestCoordinatedIntention", agentId, intention);
        if (intention && intention.intention && intention.intention.tile) {
            Coordinator.setIntentionStatus(intention, true);
            Coordinator.lockIntention(agentId, intention.intention.tile);
            await Communication.Coord.stopAgentIntention(client, agentId, intention.intention);
            
            return intention.intention;
        } else {
            let randomIntention = new Desire(
                Coordinator.getRandomTile(),
                1,
                null,
                false,
            );
            
            Coordinator.lockIntention(agentId, randomIntention.tile);
            await Communication.Coord.stopAgentIntention(client, agentId, randomIntention);
            
            return randomIntention; 
        }
    }

    static lockIntention(agentId, tile) {
        Coordinator.allIntentions = Coordinator.allIntentions.filter(
            (intention) =>
                intention.agentId === agentId ||    
                intention.intention.tile !== tile
        );
    }

    static getRandomTile() {
        let tile = null;
        while (tile === null || tile.type === TileType.OBSTACLE || Coordinator.ignoredTiles.some((t) => t.x === tile.x && t.y === tile.y)){
            let x = Math.floor(Math.random() * Coordinator.getMap().width);
            let y = Math.floor(Math.random() * Coordinator.getMap().height);
            tile = Coordinator.getMap().tiles[x][y];
        }
        return tile;
    }

    static setIntentionStatus(intention, status) {
        // console.log("setto intention status ", intention, "con desire ", intention.intention)
        for (const agentId of Coordinator.agents.keys()) {
            const intentionIndex = Coordinator.allIntentions.findIndex(
                (i) =>
                    i.agentId === agentId &&
                    Coordinator.equalsIntention(i.intention, intention.intention),
            );
            if (intentionIndex !== -1) {
                Coordinator.allIntentions[intentionIndex].isActive = status;
            }
        }
    }

    static async shiftAgentIntentions(client, agentId, previousIntention) {
        const intentionIndex = Coordinator.allIntentions.findIndex(
            (i) => i.agentId === agentId && Coordinator.equalsIntention(i.intention, previousIntention)
        );
        // console.log("shiftAgentIntentions", agentId, intentionIndex);
        if (intentionIndex !== -1) {
            Coordinator.allIntentions.splice(intentionIndex, 1);
        }
        
        let newIntention = await Coordinator.getBestCoordinatedIntention(client, agentId);
        return newIntention;
    }

    static removeCompletedIntention(intention) {
        Coordinator.allIntentions = Coordinator.allIntentions.filter(
            (i) => !Coordinator.equalsIntention(i.intention, intention),
        );

        if (intention.parcel) {
            Coordinator.allPerceivedParcels = Coordinator.allPerceivedParcels.filter(
                (p) => p.x !== intention.parcel.x || p.y !== intention.parcel.y,
            );
        }
    }

    static coordinateIntentions() {
        for (const agentId of Coordinator.agents.keys()) {
            let agentIntentions = Coordinator.selectActions(
                Coordinator.allIntentions,
                agentId,
            );
            Coordinator.allIntentions = Coordinator.allIntentions.concat(agentIntentions);
        }

        Coordinator.allIntentions = Coordinator.filterIntentionsByAgent();

        Coordinator.allIntentions = Coordinator.allIntentions.filter(
            (intention) => 
                intention.id !== null && 
                intention.intention !== null &&
                intention.intention.tile !== null &&
                intention.intention.gain !== null 
        );           
        
        Coordinator.allIntentions.sort(
            (a, b) => b.intention.gain - a.intention.gain,
        );
    }

    static filterIntentionsByAgent() {
        const activeIntentions = Coordinator.allIntentions.filter(
            (intent) => intent.isActive,
        );

        const inactiveIntentions = Coordinator.allIntentions
            .filter((intent) => !intent.isActive)
            .reduce((acc, intention) => {
                const existing = acc.find(
                    (item) => item.intention.tile === intention.intention.tile,
                );

                if (
                    !existing ||
                    intention.intention.gain > existing.intention.gain
                ) {
                    if (existing) {
                        acc.splice(acc.indexOf(existing), 1);
                    }
                    acc.push(intention);
                }

                return acc;
            }, []);

        return [...activeIntentions, ...inactiveIntentions];
    }

    static selectActions(allIntentions, agentId) {
        const selectedActions = [];

        for (const intention of allIntentions) {
            if (intention.agentId !== agentId || intention.isActive) {
                continue;
            }

            const agentPosition = {
                x: Math.round(Coordinator.agents.get(agentId).last_x),
                y: Math.round(Coordinator.agents.get(agentId).last_y),
            };
    
            Coordinator.currentAgentGoal = intention.intention.tile;
    
            let path = Coordinator.computePath(agentPosition);
    
            if (path.status !== "success") {
                continue;
            }

            // Check if the action interferes with any active action
            const isInterference = allIntentions.some(
                (selectedAction) =>
                    selectedAction.agentId !== agentId &&
                    selectedAction.isActive &&
                    // selectedAction.intention && 
                    !Coordinator.equalsIntention(
                        selectedAction.intention,
                        intention.intention,
                    ) &&
                    Coordinator.checkIntentionInterference(
                        agentId,
                        intention.intention,
                        selectedAction.intention,
                    ),
            );

            let teamInterference = Coordinator.checkTeamInterference(agentId, path);

            if (
                !isInterference &&
                !Coordinator.checkOpponentInterference(agentId, path) &&
                !teamInterference.existsIntersection
            ) {
                selectedActions.push(intention);
            } else if (
                !isInterference &&
                !intention.intention.parcel &&
                teamInterference.existsIntersection
            ) {
                const lastValidTile = teamInterference.lastValidTile;
                selectedActions.push({
                    agentId: agentId,
                    intention: new Desire(
                        lastValidTile,
                        intention.intention.gain,
                        null,
                        true,
                    ),
                    isActive: false,
                });
            }
        }

        return selectedActions;
    }

    static computePath(start) {
        const options = {
            start: start,
            isEnd: Coordinator.isEnd,
            neighbor: Coordinator.getNeighbors,
            distance: Coordinator.distanceBetween,
            heuristic: Coordinator.heuristic,
            hash: hash,
        };
        return aStar(options);
    }

    static isEnd(tile) {
        const end = Coordinator.getMap().getTile(Coordinator.currentAgentGoal.x, Coordinator.currentAgentGoal.y);
        return end.x === tile.x && end.y === tile.y;
    }

    static getNeighbors(tile) {
        return Coordinator.getMap().getNeighbours(tile);
    }

    static heuristic(tile) {
        return (
            Math.abs(tile.x - Coordinator.currentAgentGoal.x) + Math.abs(tile.y - Coordinator.currentAgentGoal.y)
        );
    }

    static checkTeamInterference(agentId, path) {
        let finalTile = path.path[path.path.length - 1];
        path = path.path.slice(0,2);

        const visitedTiles = new Set();
        let lastValidTile = path[0];
        let existsIntersection = false;

        for (const tile of path) {
            const key = `${tile.x},${tile.y}`;
            visitedTiles.add(key);

            // Check if any agent is already on the current tile
            const agentOnTile = Array.from(Coordinator.agents.entries()).find(
                ([agent, agentTile]) =>
                    agent !== agentId &&
                    agentTile.last_x === tile.x &&
                    agentTile.last_y === tile.y,
            );

            if (!agentOnTile) {
                lastValidTile = tile;
            } else {
                existsIntersection = true;

                let carriedBy = Coordinator.getCarriedBy(agentId);

                for (const carriedParcel of carriedBy) {
                    Coordinator.allIntentions.push({
                        agentId: agentOnTile[0],
                        intention: new Desire(
                            lastValidTile,
                            Coordinator.computeParcelGain(agentOnTile[0], carriedParcel),
                            carriedParcel,
                            false
                        ),
                        isActive: false
                    });
                }
                break;
            }
        }

        return {
            existsIntersection: existsIntersection,
            lastValidTile: existsIntersection ? lastValidTile : finalTile,
        };
    }

    static checkOpponentInterference(agentId, path) {
        path = path.path;

        const visitedTiles = new Set();
        let existsIntersection = false;

        for (const tile of path) {
            const key = `${tile.x},${tile.y}`;
            visitedTiles.add(key);
        }

        // Iterate over the perceived agents and check if any tile is not available
        for (const agent of Coordinator.allPerceivedAgents) {
            if (agent.name === "god" || agent.id === agentId || Coordinator.hasAgent(agent.id)) {
                continue;
            }
            const key = `${agent.x},${agent.y}`;

            if (visitedTiles.has(key)) {
                // Common tile found, path not available
                existsIntersection = true;
                break;
            }
        }
        return existsIntersection;
    }

    static checkIntentionInterference(agentId, intentionA, intentionB) {
        if (intentionA.tile === intentionB.tile) {
            return true;
        } else {
            return false;
        }

        // const agentPosition = {
        //     x: Math.round(Coordinator.agents.get(agentId).last_x),
        //     y: Math.round(Coordinator.agents.get(agentId).last_y),
        // };

        // Coordinator.currentAgentGoal = intentionA.tile;
        // let pathToA = Coordinator.computePath(agentPosition);

        // Coordinator.currentAgentGoal = intentionB.tile;
        // let pathToB = Coordinator.computePath(agentPosition);

        // Coordinator.currentAgentGoal = intentionA.tile;

        // if (pathToA.status !== "success" || pathToB.status !== "success") {
        //     return false;
        // }

        // const existsIntersection = Coordinator.checkPathIntersection(
        //     pathToA.path,
        //     pathToB.path,
        // );

        // return existsIntersection;
    }

    static checkPathIntersection(pathA, pathB) {
        const visitedTiles = new Set();
        let existsIntersection = false;

        // Iterate over the objects in the first path and mark the tiles as visited
        for (const tile of pathA) {
            const key = `${tile.x},${tile.y}`;
            visitedTiles.add(key);
        }

        // Iterate over the objects in the second path and check if any tile is already visited
        for (const tile of pathB) {
            const key = `${tile.x},${tile.y}`;

            if (visitedTiles.has(key)) {
                // Paths intersect, common tile found
                existsIntersection = true;
                break;
            }
        }

        return existsIntersection;
    }
}

export default Coordinator;
