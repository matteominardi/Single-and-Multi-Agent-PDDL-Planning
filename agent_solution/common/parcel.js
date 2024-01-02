class Parcel {
    /**
     * Id of the parcel
     * @type {string}
     */
    id
    /**
     * X coordinate of the parcel
     * @type {number}
     */
    x
    /**
     * Y coordinate of the parcel
     * @type {number}
     */
    y
    /**
     * Id of the agent carrying the parcel
     * @type {string | null}
     */
    carriedBy
    /**
     * Reward of the parcel
     * @type {number}
     */
    reward
    /**
     * Distance of the parcel to the agent
     * @type {number | null}
     */

    /**
     *
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
        this.distance = null;
    }
}

class Parcels extends Set {

    /**
     * Create Set for Parcels
     */
    constructor() {
        super();
    }

    /**
     * Get the parcel with the given id
     * @param {string} id
     * @return {Parcel | null}
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
     * Update parcel given its id
     * @param {Parcel} newParcel
     */
    updateParcel(newParcel) {
        for (let p of this) {
            if (p.id === newParcel.id) {
                p = newParcel;
                return;
            }
        }
    }

}

export { Parcel, Parcels };