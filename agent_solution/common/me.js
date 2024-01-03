/**
 * Represents the possible actions that the agent can perform
 * @date 1/3/2024 - 4:22:47 PM
 *
 * @type {{ UP: string; DOWN: string; LEFT: string; RIGHT: string; PICKUP: string; PUTDOWN: string; }}
 */
const Actions = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  PICKUP: "pickup",
  PUTDOWN: "putdown",
};

/**
 * Represents the agent itself.
 * @date 1/2/2024 - 3:37:14 PM
 *
 * @class Me
 * @typedef {Me}
 */
class Me {
  /**
   * My id
   * @date 1/2/2024 - 3:43:26 PM
   *
   * @type {string}
   */
  static id;
  /**
   * My name
   * @date 1/2/2024 - 3:43:51 PM
   *
   * @type {string}
   */
  static name;
  /**
   * Previous x coordinate
   * @date 1/2/2024 - 5:07:32 PM
   *
   * @type {number}
   */
  static previous_x;
  /**
   * Last x coordinate
   * @date 1/2/2024 - 3:44:04 PM
   *
   * @type {number}
   */
  static last_x;
  /**
   * Previous y coordinate
   * @date 1/2/2024 - 5:13:49 PM
   *
   * @type {number}
   */
  static previous_y;
  /**
   * Last y coordinate
   * @date 1/2/2024 - 3:44:14 PM
   *
   * @type {number}
   */
  static last_y;

  /**
   * My score
   * @date 1/2/2024 - 3:44:51 PM
   *
   * @type {number}
   */
  static score;
  /**
   * Store my information
   * @date 1/2/2024 - 3:45:12 PM
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

  /**
   * Update my information
   * @date 1/2/2024 - 3:47:20 PM
   *
   * @param {string} id
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @param {number} score
   */
  static update(id, name, x, y, score) {
    Me.id = id;
    Me.name = name;
    // set previous equal to last if it's the first time
    if (Me.last_x === undefined) {
      Me.previous_x = x;
    } else {
      Me.previous_x = Me.last_x;
    }
    if (Me.last_y === undefined) {
      Me.previous_y = y;
    } else {
      Me.previous_y = Me.last_y;
    }
    Me.last_x = x;
    Me.last_y = y;
    Me.score = score;
  }

  /**
   * Check if the agent has moved
   * @date 1/2/2024 - 5:16:12 PM
   *
   * @returns {boolean}
   */
  static hasMoved() {
    console.log(Me.previous_x, Me.last_x, Me.previous_y, Me.last_y);
    let check = Me.previous_x !== Me.last_x || Me.previous_y !== Me.last_y;
    Me.previous_x = Me.last_x;
    Me.previous_y = Me.last_y;
    return check;
  }

  /**
   * Perform the given action
   * @date 1/3/2024 - 4:18:51 PM
   *
   * @param {DeliverooApi} client
   * @param {Actions} action
   */
  static do_action(client, action) {
    console.log(Me.last_x, Me.last_y);
    console.log("Performing action: " + action);
    if (
      action === Actions.UP ||
      action === Actions.DOWN ||
      action === Actions.LEFT ||
      action === Actions.RIGHT
    ) {
      client.move(action).then((res) => {
        if (Me.hasMoved()) {
          console.log("Move successful");
        } else {
          console.log("Move failed");
        }
      });
    } else if (action === Actions.PICKUP) {
      client.pickup().then((res) => {
        console.log("Pickup successful");
      });
    } else if (action === Actions.PUTDOWN) {
      client.putdown().then((res) => {
        console.log("Putdown successful");
      });
    }
  }
}

export default Me;
export { Actions };
