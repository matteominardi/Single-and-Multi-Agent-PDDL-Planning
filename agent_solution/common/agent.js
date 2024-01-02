class Agent {
    /**
     * Id of the agent
     * @param {string} id
     */
    id
    /**
     * Name of the agent
     * @param {string} name
     */
    name
    /**
     * x coordinate of the agent
     * @param {number} x
     */
    x
    /**
     * y coordinate of the agent
     * @param {number} y
     */
    y
    /**
     * score of the agent
     * @param {number} score
     */
    score

    /**
     * @param {string} id
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} score
     */
    constructor(id, name, x, y, score) {
        this.id = id
        this.name = name
        this.x = x
        this.y = y
        this.score = score
    }
}

class Agents extends Set {

    /**
     * Create Set for Agents
     */
    constructor() {
        super()
    }

    /**
     * Get agent by its id
     * @param id
     * @return Agent
     */
    getAgent(id){
        for (let agent of this) {
            if (agent.id === id) {
                return agent;
            }
        }
        return null;
    }

    /**
     * Update agent given its id
     * @param {Agent} newAgent
     */
    updateAgent(newAgent) {
        for (let agent of this) {
            if (agent.id === newAgent.id) {
                agent = newAgent;
                return;
            }
        }
    }

}

export { Agent, Agents }