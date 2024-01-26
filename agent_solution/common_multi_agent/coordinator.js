import { Parcels } from "./parcel.js";
import { TileMap } from "./world.js";
import Config from "./config.js";

class Coordinator {
    static map = null;
    static agents = new Map(); // used to store the position of the known agents
    static ignoredParcels = new Parcels(); // used to store the parcels that should not be considered anymore
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
        if (!Coordinator.isUpdatingBeliefs) {
            Coordinator.isUpdatingBeliefs = true;
            
            setInterval(() => {
                Coordinator.decayParcelsReward();
                Coordinator.decayAllIntentionGains();
                Coordinator.filterAllIntentionGains();
            }, Coordinator.getConfig().PARCEL_DECADING_INTERVAL);
        }
    }

    static getMap() {
        return this.map;
    }

    static initMap(width, height, tiles) {
        this.map = new TileMap(width, height, tiles);
    }

    static equalsIntention(intentionA, intentionB) {
        return intentionA.tile === intentionB.tile;
    }

    static hasAgent(agentId) {
        return this.agents.has(agentId);
    }

    static updateAgent(agentId, tile) {
        this.agents.set(agentId, tile);
    }

    static addPerceivedParcels(perceivedParcels) {
        for (const parcel of perceivedParcels) {
            const parcelIndex = this.allPerceivedParcels.findIndex((p) => p.id === parcel.id);
            
            if (parcelIndex === -1) {
                this.allPerceivedParcels.push(parcel);
            } else {
                this.allPerceivedParcels[parcelIndex] = parcel;
            }
        }
    }

    static removeParcel(parcelId) {
        const parcelIndex = this.allPerceivedParcels.findIndex((p) => p.id === parcelId);
        
        if (parcelIndex !== -1) {
            this.ignoredParcels.addParcel(
                new Parcel(
                    parcelId,
                    this.allPerceivedParcels[parcelIndex].x,
                    this.allPerceivedParcels[parcelIndex].y,
                    this.allPerceivedParcels[parcelIndex].carriedBy,
                    this.allPerceivedParcels[parcelIndex].reward
                )
            );
        }
    }

    static shouldConsiderParcel(parcelId) {
        return this.ignoredParcels.getParcel(parcelId) === null;
    }

    static addPerceivedAgents(perceivedAgents) {
        for (const agent of perceivedAgents) {
            const agentIndex = this.allPerceivedAgents.findIndex((a) => a.id === agent.id);
            
            if (agentIndex === -1) {
                this.allPerceivedAgents.push(agent);
            } else {
                this.allPerceivedAgents[agentIndex] = agent;
            }
        }
    }

    static getAllPerceivedAgents() {
        return this.allPerceivedAgents;
    }

    static computeAllDesires() {
        for (agentId of this.agents.keys()) {
            this.computeAgentDesires(agentId);
        }
    }

    static computeAgentDesires(agentId) {
        let options = [];

        for (let p in this.allPerceivedParcels) {
            if (
                this.shouldConsiderParcel(p.id) &&
                p.carriedBy === null
            ) {
                let score = this.computeParcelGain(agentId, p);

                if (score > 0) {
                    options.push(
                        new Desire(
                            this.getMap().getTile(
                                p.x,
                                p.y,
                            ),
                            score,
                            p,
                        ),
                    );
                }
            }
        }

        const parcelsViewed = options.length;

        const deliverySpots = this.getMap().getDeliverySpots();

        for (let d in deliverySpots) {
            let score = this.computeDeliveryGain(deliverySpots[d]);

            if (score > 0) {
                options.push(
                    new Desire(
                        this.getMap().getTile(
                            deliverySpots[d].x,
                            deliverySpots[d].y,
                        ),
                        score,
                    ),
                );
            }
        }

        if (parcelsViewed === 0 && this.getCarriedBy(agentId).length === 0) {
            options.push(
                new Desire(
                    this.getMap().getRandomTile(), 
                    1
                )
            );
        }
        // options.sort((a, b) => b.gain - a.gain); // best first

        this.addAgentIntentions(agentId, options);
    }

    static computeParcelGain(agentId, parcel) {
        let score = 0;

        const gonnaCarry = getCarriedBy(agentId).length + 1; // agentId + parcel
        const factor = 0.01 +
            this.getConfig().MOVEMENT_DURATION /
            this.getConfig().PARCEL_DECADING_INTERVAL;
        const parcelDistance = distanceBetween(
            this.agents.get(agentId),
            this.getMap().getTile(parcel.x, parcel.y),
        );
        const closestDeliverySpotDistance = distanceBetween(
            this.getMap().getTile(parcel.x, parcel.y),
            BeliefSet.getClosestDeliverySpot(parcel),
        );
        score += this.getAgentReward(agentId); // agentId carrying
        score += parcel.reward; // parcel reward
        score -= factor * parcelDistance;
        score -= gonnaCarry * factor * closestDeliverySpotDistance; // me + parcels decading

        return score;
    }

    static computeDeliveryGain(agentId, deliverySpot) {
        let score = 0;

        const gonnaCarry = getCarriedBy(agentId).length;
        const factor = 0.01 +
            this.getConfig().MOVEMENT_DURATION /
            this.getConfig().PARCEL_DECADING_INTERVAL;
        const distance = distanceBetween(
            this.agents.get(agentId),
            deliverySpot,
        );
        score += this.getAgentReward(agentId); // agentId carrying
        score -= gonnaCarry * factor * distance; // me + parcel decading

        return score;
    }

    static getCarriedBy(agentId) {
        let parcels = [];
        for (let p of this.allPerceivedParcels) {
            if (p.carriedBy === agentId) {
                parcels.push(p);
            }
        }
        return parcels;
    }

    static getAgentReward(agentId) {
        let carriedParcels = this.getCarriedBy(agentId);
        let reward = 0;
        for (let p of carriedParcels) {
            reward += p.reward;
        }
        return reward;
    }

    static decayParcelsReward() {
        const decay = 1000 / this.getConfig().PARCEL_DECADING_INTERVAL;
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

    static decayAllIntentionGains() {
        for (agentId in this.agents.keys()) {
            for (let intention of this.allIntentions) {
                if (intention.agentId !== agentId) {
                    continue;
                }

                if (intention.intention.parcel) {
                    intention.intention.gain = this.computeParcelGain(agentId, intention.intention.parcel);
                } else {
                    if (intention.intention.tile.type === TileType.DELIVERY) {
                        intention.intention.gain = this.computeDeliveryGain(agentId, intention.intention.tile);
                    }
                }
            }
        }
    }

    static filterAllIntentionGains() {
        this.allIntentions = this.allIntentions.filter((d) => d.intention.gain > 0);
    }

    static addAgentIntentions(agentId, agentDesires) {
        for (const desire of agentDesires) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && this.equalsIntention(i.intention, desire)
            );
            
            if (intentionIndex === -1 && !this.isAlreadyActiveIntention(agentId, desire)) {
                this.allIntentions.push({ agentId: agentId, intention: desire, isActive: false });
            } else {
                this.allIntentions[intentionIndex].intention.gain = desire.gain;
            }
        }

        this.allIntentions.sort((a, b) => b.intention.gain - a.intention.gain);
    }
    
    static getAgentIntentions(agentId) {
        return this.allIntentions.filter((i) => i.agentId === agentId);
    }

    static isAlreadyActiveIntention(agentId, intention) {
        let isActive = false;
        
        for (const otherAgentId of this.agents) {
            if (otherAgentId === agentId) {
                continue;
            }

            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === otherAgentId && this.equalsIntention(i.intention, intention)
            );
            
            if (intentionIndex !== -1) {
                isActive = isActive || this.allIntentions[intentionIndex].isActive;
            }

            if (isActive) {
                break;
            }
        }

        return isActive;
    }

    static getBestCoordinatedIntention(agentId) {
        const intention = this.allIntentions.find(
            (i) => i.isActive === false && i.agentId === agentId && !this.isAlreadyActiveIntention(agentId, i.intention)
        );
        
        if (intention) {
            this.setIntentionStatus(intention, true);
        }
        
        return intention.intention;
    }

    static setIntentionStatus(intention, status) {
        for (const agentId of this.agents) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && this.equalsIntention(i.intention, intention.intention)
            );
            
            if (intentionIndex !== -1) {
                this.allIntentions[intentionIndex].isActive = status;
            }
        }
    }

    static shiftAgentIntentions(agentId) {
        const intentionIndex = this.allIntentions.findIndex((i) => i.agentId === agentId);
        
        if (intentionIndex !== -1) {
            this.allIntentions = this.allIntentions.splice(intentionIndex, 1);
        }
    }

    static removeCompletedIntention(intention) {
        for (const agentId of this.agents) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && this.equalsIntention(i.intention, intention)
            );
            
            if (intentionIndex !== -1) {
                this.allIntentions.splice(intentionIndex, 1);
            }
        }
    }

    static coordinateIntentions() {
        // Keep actions with the highest gain for each agent without interference
        for (const agentId of this.agents) {
            let agentIntentions = this.selectActions(this.allIntentions, agentId);
            this.allIntentions = this.allIntentions.concat(agentIntentions);
        }

        this.allIntentions = this.filterIntentionsByAgent();

        this.allIntentions = this.allIntentions.sort((a, b) => b.intention.gain - a.intention.gain);
    }

    static filterIntentionsByAgent() {
        const activeIntentions = intentions.filter(intent => intent.isActive);

        const inactiveIntentions = intentions
            .filter(intent => !intent.isActive)
            .reduce((acc, intention) => {
            const existing = acc.find(item => item.intention.tile === intention.intention.tile);

            if (!existing || intention.intention.gain > existing.intention.gain) {
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

            // Check if the action interferes with any active action
            const isInterference = allIntentions.some((selectedAction) =>
                !this.equalsIntention(selectedAction.intention, intention.intention) && 
                selectedAction.isActive &&
                selectedAction.agentId !== agentId && 
                this.checkIntentionInterference(intention.intention, selectedAction.intention)
            );
            
            if (!isInterference && !this.checkAgentInterference(agentId, intention.intention)) {
                selectedActions.push(intention);
            }
        }
    
        return selectedActions;
    }

    static checkAgentInterference(agentId, intention) {
        const path = Me.pathTo(intention.tile);
        const visitedTiles = new Set();
        let existsIntersection = false;

        for (const tile of path) {
            const key = `${tile.x},${tile.y}`;
            visitedTiles.add(key);
        }

        // Iterate over the perceived agents and check if any tile is not available
        for (const agent of this.allPerceivedAgents) {
            if (agent.id === agentId) {
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
    
    static checkIntentionInterference(intentionA, intentionB) {
        if (intentionA.tile === intentionB.tile) {
            return true;
        }

        const pathToA = Me.pathTo(intentionA.tile);
        const pathToB = Me.pathTo(intentionB.tile);

        if (pathToA.status !== "success" || pathToB.status !== "success") {
            return false;
        }

        const existsIntersection = this.checkPathIntersection(pathToA.path, pathToB.path);

        return existsIntersection;
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