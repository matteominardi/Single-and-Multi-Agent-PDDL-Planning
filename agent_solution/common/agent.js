/**
 * Represents an agent
 * @date 1/2/2024 - 3:34:05 PM
 *
 * @class Agent
 * @typedef {Agent}
 */
class Agent {
    /**
     * Id of the agent
     * @date 1/2/2024 - 3:24:50 PM
     *
     * @type {string}
     */
    id;

    /**
     * Name of the agent
     * @date 1/2/2024 - 3:27:42 PM
     *
     * @type {string}
     */
    name;

    /**
     * X coordinate of the agent
     * @date 1/2/2024 - 3:27:56 PM
     *
     * @type {number}
     */
    x;

    /**
     * Y coordinate of the agent
     * @date 1/2/2024 - 3:28:05 PM
     *
     * @type {number}
     */
    y;

    /**
     * Score of the agent
     * @date 1/2/2024 - 3:28:16 PM
     *
     * @type {number}
     */
    score;

    /**
     * Creates a new agent.
     * @date 1/2/2024 - 3:28:28 PM
     *
     * @constructor
     * @param {string} id
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {number} score
     */
    constructor(id, name, x, y, score) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.score = score;
    }
}

/**
 * Represents a set of agents
 * @date 1/2/2024 - 3:34:17 PM
 *
 * @class Agents
 * @typedef {Agents}
 * @extends {Set}
 */
class Agents extends Set {
    /**
     * Creates a set of agents.
     * @date 1/2/2024 - 3:23:12 PM
     *
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Add an agent to the set
     * @date 1/2/2024 - 4:52:20 PM
     *
     * @param {*} agent
     * @returns {*}
     */
    addAgent(agent) {
        if (agent instanceof Agent) {
            this.add(agent);
        } else {
            let newAgent = new Agent(agent.id, agent.name, agent.x, agent.y, agent.score);
            this.add(newAgent);
        }
    }

    /**
     *Get the agent with the given id
     * @date 1/2/2024 - 3:23:34 PM
     *
     * @param {string} id
     * @returns {Agent | null}
     */
    getAgent(id) {
        for (let agent of this) {
            if (agent.id === id) {
                return agent;
            }
        }
        return null;
    }

    /**
     * Update the agent that has the same id as the given agent
     * @date 1/2/2024 - 3:24:15 PM
     *
     * @param {*} newAgent
     */
    updateAgent(newAgent) {
        for (let agent of this) {
            if (agent.id === newAgent.id) {
                agent.name = newAgent.name;
                agent.x = newAgent.x;
                agent.y = newAgent.y;
                agent.score = newAgent.score;
                return;
            }
        }
    }
}

export { Agent, Agents };
