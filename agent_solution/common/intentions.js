class Intention {
    constructor() {}
}

class Intensions {
    static queue = [];

    static add(intention) {
        this.queue.push(intention);
    }

    static sort() {
        this.queue.sort((a, b) => {
            return a.priority - b.priority;
        });
    }

    async achieve() {

    }

}
