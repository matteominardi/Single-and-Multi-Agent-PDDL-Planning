import BeliefSet from "./belief.js";
import {
    computeParcelGain,
    computeDeliveryGain,
    distanceBetween,
} from "./helpers.js";

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
            if (
                BeliefSet.shouldConsiderParcel(parcels[p].id) &&
                parcels[p].carriedBy === null
            ) {
                let score = computeParcelGain(parcels[p]);

                if (score > 0) {
                    options.push(
                        new Desire(
                            BeliefSet.getMap().getTile(
                                parcels[p].x,
                                parcels[p].y,
                            ),
                            score,
                            parcels[p],
                        ),
                    );
                }
            }
        }

        const parcelsViewed = options.length;

        const deliverySpots = BeliefSet.getMap().getDeliverySpots();

        for (let d in deliverySpots) {
            let score = computeDeliveryGain(deliverySpots[d]);

            if (score > 0) {
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
        }
        // check for all options if their .parcel is null

        if (BeliefSet.getCarriedByMe().length === 0) {
            options.push(new Desire(BeliefSet.getMap().getRandomTile(), 1));
        }

        if (BeliefSet.getCarriedByMe().length > 4) {
            let closestDeliverySpot = BeliefSet.getClosestDeliverySpot(
                BeliefSet.getMe().getMyPosition(),
            );
            // console.log("closestDeliverySpot", closestDeliverySpot);
            options.push(new Desire(closestDeliverySpot, Infinity));
        }

        return options.sort((a, b) => {
            if (a.gain !== b.gain) {
                return b.gain - a.gain;
            } else {
                return (
                    distanceBetween(BeliefSet.getMe().getMyPosition(), a.tile) -
                    distanceBetween(BeliefSet.getMe().getMyPosition(), b.tile)
                );
            }
        }); // best first
    }
}

export default Desires;
