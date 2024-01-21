class Coordinator {
    coordinatedActions;
    allIntentions;

    constructor() {
        this.coordinatedActions = new Map();
        this.allIntentions = [];
    }

    hasAgent(agentId) {
        return this.coordinatedActions.has(agentId);
    }

    addAgent(agentId) {
        this.coordinatedActions.set(agentId, []);
    }

    addAgentIntentions(agentId, intentions) {
        this.coordinatedActions.set(agentId, intentions);
    }
    
    getCoordinatedIntentions(agentId) {
        return this.coordinatedActions.get(agentId);
    }

    isAlreadyActiveIntention(agentId, intention) {
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

    getBestCoordinatedIntention(agentId) {
        const intentions = this.coordinatedActions.get(agentId);
        const intention = intentions.find((i) => !this.isAlreadyActiveIntention(agentId, i));
        
        setIntentionStatus(intention, true);
        
        return intention;
    }

    setIntentionStatus(intention, status) {
        for (const agentId of this.coordinatedActions.keys()) {
            const intentions = this.coordinatedActions.get(agentId);
            const intentionIndex = intentions.findIndex((i) => i.equals(intention));
            intentions[intentionIndex].isActive = status;
        }

        const intentionIndex = this.allIntentions.findIndex((i) => i.equals(intention));
        this.allIntentions[intentionIndex].isActive = status;
    }

    removeCompletedIntention(intention) {
        for (const agentId of this.coordinatedActions.keys()) {
            const intentions = this.coordinatedActions.get(agentId);
            const intentionIndex = intentions.findIndex((i) => i.equals(intention));
            intentions.splice(intentionIndex, 1);
        }

        const intentionIndex = this.allIntentions.findIndex((i) => i.equals(intention));
        this.allIntentions.splice(intentionIndex, 1);
    }

    coordinateIntentions() {
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
    
    selectActions(sortedIntentions, agentId) {
        const selectedActions = [];
    
        for (const sortedIntention of sortedIntentions) {
            if (sortedIntention.agentId !== agentId || sortedIntention.isActive) {
                continue;
            }

            // Check if the action interferes with any selected action
            const isInterference = selectedActions.some((selectedAction) =>
                this.checkInterference(sortedIntention.intention, selectedAction.intention)
            );

            // If there is no interference, select the action
            if (!isInterference) {
                selectedActions.push(intention);
            }
        }
    
        return selectedActions.sort((a, b) => b.intention.gain - a.intention.gain);
    }
    
    checkInterference(intentionA, intentionB) {
        // Implement logic to check interference between two intentions
        // TODO: check also if paths to intentions intersect
        return intentionA.tile === intentionB.tile;
    }
}