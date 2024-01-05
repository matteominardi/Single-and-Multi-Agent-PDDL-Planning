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

    hasMoved() {
        let check =
            this.previous_x !== this.last_x || this.previous_y !== this.last_y;
        this.previous_x = this.last_x;
        this.previous_y = this.last_y;
        return check;
    }

    toPddl() {
        // TODO: implement this to use online planner
        return;
    }

    do_action(client, action) {
        console.log("Performing action: " + action);
        if (
            action === Actions.UP ||
            action === Actions.DOWN ||
            action === Actions.LEFT ||
            action === Actions.RIGHT
        ) {
            client.move(action).then((res) => {
                if (this.hasMoved()) {
                    console.log("Move successful");
                } else {
                    console.error("Move failed");
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
