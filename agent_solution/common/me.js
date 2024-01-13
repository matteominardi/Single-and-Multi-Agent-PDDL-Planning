import BeliefSet from "./belief.js";
import { sleep, getPath } from "./helpers.js";

const Actions = {
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
    PICKUP: "pickup",
    PUT_DOWN: "put_down",
};

class Me {
    id;
    name;
    previous_x;
    last_x;
    previous_y;
    last_y;
    score;
    static requested_x;
    static requested_y;

    constructor() {}

    update(me) {
        this.id = me.id;
        this.name = me.name;

        // set previous equal to last if it's the first time
        if (this.last_x === undefined) this.previous_x = me.x;
        else this.previous_x = this.last_x;
        if (this.last_y === undefined) this.previous_y = me.y;
        else this.previous_y = this.last_y;

        this.last_x = me.x;
        this.last_y = me.y;
        this.score = me.score;
    }

    async hasMoved() {
        await sleep(500);
        let check =
            this.previous_x !== this.last_x || this.previous_y !== this.last_y;
        this.previous_x = this.last_x;
        this.previous_y = this.last_y;
        return check;
    }

    getMyPosition() {
        return BeliefSet.getMap().getTile(this.last_x, this.last_y);
    }

    async do_action(client, action) {
        console.log("Performing action: " + action);
        if (
            action === Actions.UP ||
            action === Actions.DOWN ||
            action === Actions.LEFT ||
            action === Actions.RIGHT
        ) {
            await client.move(action)
            if (await this.hasMoved()) {
                console.log("Move successful");
            } else {
                throw "Move failed"
            }
        } else if (action === Actions.PICKUP) {
            await client.pickup();
            console.log("Pickup successful");
            // TODO: add to inventory
        } else if (action === Actions.PUT_DOWN) {
            client.putdown();
            console.log("Put down successful");
            // TODO: remove all from inventory
        }
    }

    static pathTo(tile) {
        let current = BeliefSet.getMe().getMyPosition();
        let path = getPath(current, tile);
        return path;
    }
}

export default Me;
export { Actions };
