import BeliefSet from "./belief";

class BDI {
    beliefs;

    constructor() {
        return;
    }

    updateBeliefs() {
        this.beliefs = BeliefSet.getBeliefs();
    }

    loop() {
        throw new Error("Method 'loop()' must be implemented.");
    }
}
