import BeliefSet from "./belief.js";
import { computePath, getPath } from "./helpers.js";
import { TileType } from "./world.js";
import Communication from "./communication.js";

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
        let check =
            this.previous_x !== this.last_x || this.previous_y !== this.last_y;
        this.previous_x = this.last_x;
        this.previous_y = this.last_y;
        return check;
    }

    getMyPosition() {
        return BeliefSet.getMap().getTile(this.last_x, this.last_y);
    }

    async performAction(client, requestedIntention) {
        let currentTile = this.getMyPosition();
        let perceivedParcels = Array.from(BeliefSet.getParcels());
        perceivedParcels = perceivedParcels.filter(
            (parcel) => parcel.reward > 1,
        );
        let carriedByMe = BeliefSet.getCarriedByMe();
        if (
            (requestedIntention.forcedDelivery === true &&
                carriedByMe.length > 0) ||
            (requestedIntention.forcedDelivery === false &&
                currentTile.type === TileType.DELIVERY &&
                carriedByMe.length > 0)
        ) {
            await this.do_action(client, Actions.PUT_DOWN);
            BeliefSet.emptyCarriedByMe();
            for (let parcel in carriedByMe) {
                await Communication.Agent.emptyCarrying(
                    client,
                    carriedByMe[parcel].id,
                );
            }
        } else if (
            currentTile.type !== TileType.OBSTACLE &&
            currentTile.type !== TileType.DELIVERY
        ) {
            for (let parcel in perceivedParcels) {
                if (
                    BeliefSet.shouldConsiderParcel(
                        perceivedParcels[parcel].id,
                    ) &&
                    perceivedParcels[parcel].carriedBy === null &&
                    perceivedParcels[parcel].x === currentTile.x &&
                    perceivedParcels[parcel].y === currentTile.y
                ) {
                    console.log("Trying to pick up", perceivedParcels[parcel]);
                    await this.do_action(client, Actions.PICKUP);

                    BeliefSet.setCarriedByMe(perceivedParcels[parcel]);

                    await Communication.Agent.removeCompletedIntention(client, {
                        intention: {
                            tile: currentTile,
                            gain: 1,
                            parcel: perceivedParcels[parcel],
                        },
                        agentId: BeliefSet.getMe().id,
                    });
                    break;
                }
            }
        }
    }

    async do_action(client, action) {
        if (
            action === Actions.UP ||
            action === Actions.DOWN ||
            action === Actions.LEFT ||
            action === Actions.RIGHT
        ) {
            await client.move(action);
            if (!(await this.hasMoved())) {
                throw "Move failed";
            }
        } else if (action === Actions.PICKUP) {
            await client.pickup();
            console.log("Pickup successful");
        } else if (action === Actions.PUT_DOWN) {
            client.putdown();
            console.log("Put down successful");
        }
    }

    static async pathTo(client, tile) {
        let current = BeliefSet.getMe().getMyPosition();
        Me.requested_x = tile.x;
        Me.requested_y = tile.y;
        return await computePath(client, current);
    }

    static oldPathTo(tile) {
        let current = BeliefSet.getMe().getMyPosition();
        Me.requested_x = tile.x;
        Me.requested_y = tile.y;
        return getPath(current);
    }
}

export default Me;
export { Actions };
