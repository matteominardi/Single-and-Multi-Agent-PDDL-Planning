class Agent {
    id;
    name;
    x;
    y;
    score;

    constructor(id, name, x, y, score) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.score = score;
    }
}

class Agents extends Set {
    constructor() {
        super();
    }

    addAgent(agent) {
        if (agent instanceof Agent) {
            this.add(agent);
        } else {
            let newAgent = new Agent(
                agent.id,
                agent.name,
                agent.x,
                agent.y,
                agent.score,
            );
            this.add(newAgent);
        }
    }

    getAgent(id) {
        for (let agent of this) {
            if (agent.id === id) {
                return agent;
            }
        }
        return null;
    }

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
