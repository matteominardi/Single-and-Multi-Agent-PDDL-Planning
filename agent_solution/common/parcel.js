/**
 * Represents a parcel
 * @date 1/2/2024 - 3:33:26 PM
 *
 * @class Parcel
 * @typedef {Parcel}
 */
class Parcel {
  /**
   * Id of the parcel
   * @date 1/2/2024 - 3:29:30 PM
   *
   * @type {string}
   */ id;

  /**
   * X coordinate of the parcel
   * @date 1/2/2024 - 3:29:49 PM
   *
   * @type {number}
   */
  x;

  /**
   * Y coordinate of the parcel
   * @date 1/2/2024 - 3:29:58 PM
   *
   * @type {number}
   */
  y;

  /**
   * Id of the agent carrying the parcel
   * @date 1/2/2024 - 3:30:10 PM
   *
   * @type {string | null}
   */
  carriedBy;

  /**
   * Reward of the parcel
   * @date 1/2/2024 - 3:31:10 PM
   *
   * @type {number}
   */
  reward;

  /**
   * Creates a new parcel.
   * @date 1/2/2024 - 3:32:15 PM
   *
   * @constructor
   * @param {string} id
   * @param {number} x
   * @param {number} y
   * @param {string | null} carriedBy
   * @param {number} reward
   */
  constructor(id, x, y, carriedBy, reward) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.carriedBy = carriedBy;
    this.reward = reward;
  }
}

/**
 * Represents a set of parcels
 * @date 1/2/2024 - 3:33:45 PM
 *
 * @class Parcels
 * @typedef {Parcels}
 * @extends {Set}
 */
class Parcels extends Set {
  /**
   * Creates a set of parcels.
   * @date 1/2/2024 - 3:25:34 PM
   *
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Add a parcel to the set
   * @date 1/2/2024 - 4:49:09 PM
   *
   * @param {*} parcel
   */
  addParcel(parcel) {
    if (parcel instanceof Parcel) {
      this.add(parcel);
    } else {
      let newParcel = new Parcel(
        parcel.id,
        parcel.x,
        parcel.y,
        parcel.carriedBy,
        parcel.reward,
      );
      this.add(newParcel);
    }
  }

  /**
   * Get the parcel with the given id
   * @date 1/2/2024 - 3:26:00 PM
   *
   * @param {string} id
   * @returns {Parcel | null}
   */
  getParcel(id) {
    for (let parcel of this) {
      if (parcel.id === id) {
        return parcel;
      }
    }
    return null;
  }

  /**
   * Update the parcel that shares the same id as the given parcel
   * @date 1/2/2024 - 3:26:24 PM
   *
   * @param {*} newParcel
   */
  updateParcel(newParcel) {
    for (let p of this) {
      if (p.id === newParcel.id) {
        p.x = newParcel.x;
        p.y = newParcel.y;
        p.carriedBy = newParcel.carriedBy;
        p.reward = newParcel.reward;
        return;
      }
    }
  }
}

export { Parcel, Parcels };
