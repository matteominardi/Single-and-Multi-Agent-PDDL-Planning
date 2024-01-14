import BeliefSet from "./belief.js";
import { distanceBetween } from "./helpers.js";

class Desire {
    tile;
    gain;

    constructor(tile, gain, parcel = null) {
        this.tile = tile;
        this.gain = gain;
        this.parcel = parcel;
    }
}

class Desires {
    static computeDesires() {
        let options = [];

        const parcels = Array.from(BeliefSet.getParcels());

        for (let p in parcels) {
            if (parcels[p].carriedBy === null) {
                // gain parcel = distance from me to parcel
                let score = 0;
                const gonnaCarry = BeliefSet.getCarriedByMe().length + 1; // me + parcel
                const factor =
                    BeliefSet.getConfig().PARCEL_DECADING_INTERVAL /
                    BeliefSet.getConfig().MOVEMENT_DURATION;
                const parcelDistance = distanceBetween(
                    BeliefSet.getMe().getMyPosition(),
                    BeliefSet.getMap().getTile(parcels[p].x, parcels[p].y),
                );
                const closestDeliverySpotDistance = distanceBetween(
                    BeliefSet.getMap().getTile(parcels[p].x, parcels[p].y),
                    BeliefSet.getClosestDeliverySpot(parcels[p]),
                );
                score += BeliefSet.getMyReward(); // me carrying
                score += parcels[p].reward; // parcel reward
                score += closestDeliverySpotDistance; // closest delivery spot
                score -= gonnaCarry * factor * parcelDistance; // me + parcel decading
                options.push(
                    new Desire(
                        BeliefSet.getMap().getTile(parcels[p].x, parcels[p].y),
                        score,
                        parcels[p],
                    ),
                );
            }
        }

        const deliverySpots = BeliefSet.getMap().getDeliverySpots();

        for (let d in deliverySpots) {
            // gain parcel = distance from me to parcel
            let score = 0;
            const gonnaCarry = BeliefSet.getCarriedByMe().length;
            const factor =
                BeliefSet.getConfig().PARCEL_DECADING_INTERVAL /
                BeliefSet.getConfig().MOVEMENT_DURATION;
            const distance = distanceBetween(
                BeliefSet.getMe().getMyPosition(),
                deliverySpots[d],
            );
            score += BeliefSet.getMyReward(); // me carrying
            score -= gonnaCarry * factor * distance; // me + parcel decading
            options.push(
                new Desire(
                    BeliefSet.getMap().getTile(
                        deliverySpots[d].x,
                        deliverySpots[d].y,
                    ),
                    score,
                ),
            );
        }
        if (options.length === 0 || BeliefSet.getCarriedByMe().length === 0) {
            options.push(
                new Desire(
                    BeliefSet.getMap().getRandomTile(),
                    1,
                ),
            );
        }
        return options.sort((a, b) => b.gain - a.gain); // best first
    }
}

export default Desires;
