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
    id;

    /**
     * My name
     * @date 1/2/2024 - 3:43:51 PM
     *
     * @type {string}
     */
    name;

    /**
     * My x coordinate
     * @date 1/2/2024 - 3:44:04 PM
     *
     * @type {number}
     */
    x;

    /**
     * My y coordinate
     * @date 1/2/2024 - 3:44:14 PM
     *
     * @type {number}
     */
    y;

    /**
     * My score
     * @date 1/2/2024 - 3:44:51 PM
     *
     * @type {number}
     */
    score;

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
    async update(id, name, x, y, score) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.score = score;
    }
}

export default Me;
