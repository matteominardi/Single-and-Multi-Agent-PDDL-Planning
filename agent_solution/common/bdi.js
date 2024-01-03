import BeliefSet from "./belief";

class BDI {
  /**
   * Represents the agent's beliefs
   * @date 1/2/2024 - 5:10:32 PM
   *
   * @type {*}
   */ beliefs;

  /**
   * Initializes the BDI system
   * @date 1/2/2024 - 5:12:38 PM
   *
   * @constructor
   */
  constructor() {
    return;
  }

  /**
   * Get latest beliefs
   * @date 1/2/2024 - 5:12:21 PM
   */
  updateBeliefs() {
    this.beliefs = BeliefSet.getBeliefs();
  }

  /**
   * Starts the agent
   * @date 1/2/2024 - 5:07:13 PM
   *
   * @abstract
   */
  loop() {
    throw new Error("Method 'loop()' must be implemented.");
  }
}
