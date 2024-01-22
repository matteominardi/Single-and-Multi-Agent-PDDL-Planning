class Coordinator {
    static agents = new Set();
    static allIntentions = [];

    static hasAgent(agentId) {
        return this.agents.has(agentId);
    }

    static addAgent(agentId) {
        this.agents.add(agentId);
    }

    static addAgentIntentions(agentId, intentions) {
        for (const intention of intentions) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && i.intention.equals(intention)
            );
            
            if (intentionIndex === -1) {
                this.allIntentions.push({ agentId: agentId, intention: intention, isActive: false });
            } else {
                this.allIntentions[intentionIndex].intention.gain = intention.gain;
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
                (i) => i.agentId === otherAgentId && i.equals(intention)
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
            (i) => i.isActive === false && i.agentId === agentId && !this.isAlreadyActiveIntention(agentId, i)
        );
        
        if (intention) {
            setIntentionStatus(intention, true);
        }
        
        return intention;
    }

    static setIntentionStatus(intention, status) {
        for (const agentId of this.agents) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && i.equals(intention)
            );
            
            if (intentionIndex !== -1) {
                this.allIntentions[intentionIndex].isActive = status;
            }
        }
    }

    static shiftAgentIntentions(agentId) {
        const intentionIndex = this.allIntentions.findIndex((i) => i.agentId === agentId);
        
        if (intentionIndex !== -1) {
            this.allIntentions.splice(intentionIndex, 1);
        }
    }

    static removeCompletedIntention(intention) {
        for (const agentId of this.agents) {
            const intentionIndex = this.allIntentions.findIndex(
                (i) => i.agentId === agentId && i.equals(intention)
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

        this.allIntentions = this.allIntentions.sort((a, b) => b.intention.gain - a.intention.gain);
    }
    
    static selectActions(allIntentions, agentId) {
        const selectedActions = [];
    
        for (const intention of allIntentions) {
            if (intention.agentId !== agentId || intention.isActive) {
                continue;
            }

            // Check if the action interferes with any active action
            const isInterference = allIntentions.some((selectedAction) =>
                !selectedAction.equals(intention) && 
                selectedAction.isActive &&
                selectedAction.agentId !== agentId && 
                this.checkInterference(intention.intention, selectedAction.intention)
            );

            if (!isInterference) {
                selectedActions.push(intention);
            }
        }
    
        return selectedActions;
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