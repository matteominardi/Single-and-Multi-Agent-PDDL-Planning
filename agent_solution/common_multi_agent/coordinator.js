class Coordinator {
    static coordinatedActions = new Map();
    static allIntentions = [];

    static hasAgent(agentId) {
        return this.coordinatedActions.has(agentId);
    }

    static addAgent(agentId) {
        this.coordinatedActions.set(agentId, []);
    }

    static addAgentIntentions(agentId, intentions) {
        this.coordinatedActions.set(agentId, intentions);
    }
    
    static getCoordinatedIntentions(agentId) {
        return this.coordinatedActions.get(agentId);
    }

    static isAlreadyActiveIntention(agentId, intention) {
        let isActive = false;
        
        for (const otherAgentId of this.coordinatedActions.keys()) {
            if (otherAgentId === agentId) {
                continue;
            }

            const intentions = this.coordinatedActions.get(otherAgentId);
            const intentionIndex = intentions.findIndex((i) => i.equals(intention));
            
            if (intentionIndex !== -1) {
                isActive = isActive || intentions[intentionIndex].isActive;
            }

            if (isActive) {
                break;
            }
        }

        return isActive;
    }

    static getBestCoordinatedIntention(agentId) {
        const intentions = this.coordinatedActions.get(agentId);
        const intention = intentions.find((i) => !this.isAlreadyActiveIntention(agentId, i));
        
        setIntentionStatus(intention, true);
        
        return intention;
    }

    static setIntentionStatus(intention, status) {
        for (const agentId of this.coordinatedActions.keys()) {
            const intentions = this.coordinatedActions.get(agentId);
            const intentionIndex = intentions.findIndex((i) => i.equals(intention));
            intentions[intentionIndex].isActive = status;
        }

        const intentionIndex = this.allIntentions.findIndex((i) => i.equals(intention));
        this.allIntentions[intentionIndex].isActive = status;
    }

    static shiftAgentIntentions(agentId) {
        const intentions = this.coordinatedActions.get(agentId);
        intentions.shift();
    }

    static removeCompletedIntention(intention) {
        for (const agentId of this.coordinatedActions.keys()) {
            const intentions = this.coordinatedActions.get(agentId);
            const intentionIndex = intentions.findIndex((i) => i.equals(intention));
            intentions.splice(intentionIndex, 1);
        }

        const intentionIndex = this.allIntentions.findIndex((i) => i.equals(intention));
        this.allIntentions.splice(intentionIndex, 1);
    }

    static coordinateIntentions() {
        // Merge the intention queues from both agents into a single array
        for (const [agentId, intentions] of this.coordinatedActions.entries()) {
            allIntentions.push(
                ...intentions.map((intention) => ({ agentId: agentId, intention: intention, isActive: false }))
            );
        }
    
        // Sort the merged intentions by gain in descending order
        const sortedIntentions = allIntentions.sort((a, b) => b.intention.gain - a.intention.gain);
    
        // Select actions with the highest gain for each agent without interference
        for (const agentId of this.agents.keys()) {
            const selectedActions = this.selectActions(sortedIntentions, agentId);
            this.coordinatedActions.set(agentId, selectedActions);
        }
    }
    
    static selectActions(sortedIntentions, agentId) {
        const selectedActions = [];
    
        for (const sortedIntention of sortedIntentions) {
            if (sortedIntention.agentId !== agentId || sortedIntention.isActive) {
                continue;
            }

            // Check if the action interferes with any selected action
            const isInterference = selectedActions.some((selectedAction) =>
                this.checkInterference(sortedIntention.intention, selectedAction.intention)
            );

            if (!isInterference) {
                selectedActions.push(intention);
            }
        }
    
        return selectedActions.sort((a, b) => b.intention.gain - a.intention.gain);
    }
    
    static checkInterference(intentionA, intentionB) {
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