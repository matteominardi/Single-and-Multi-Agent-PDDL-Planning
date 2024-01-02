import BeliefSet from "../common/belief.js";

function updateParcels(parcels) {
    BeliefSet.updateParcels(parcels);
    console.log(BeliefSet.getParcels());

    // if (me.x % 1 != 0 || me.y % 1 != 0) return;
    //
    // // p = { id:string, x:number, y:number, carriedBy:string, reward:number }
    // for (const p of parcels) {
    //
    //     if (p.carriedBy != null) {
    //         myBeliefset.declare("carries " + p.carriedBy + " " + p.id)
    //
    //         if (db_parcels.has(p.id))
    //             db_parcels.delete(p.id);
    //
    //     } else {
    //         myBeliefset.declare("parcel " + p.id);
    //         myBeliefset.declare("at " + p.id + " " + p.x + "_" + p.y);
    //
    //         let dist = Infinity;
    //         if (me) {
    //             dist = distance({ x: p.x, y: p.y }, { x: me.x, y: me.y });
    //         }
    //
    //         if (db_parcels.has(p.id)) {
    //             let p_history = db_parcels.get(p.id);
    //
    //             if (p_history.reward != p.reward || p_history.distance != dist)
    //                 db_parcels.set(p.id, {x: p.x, y: p.y, reward: p.reward, distance: dist, gain: p.reward - dist});
    //
    //         } else {
    //             db_parcels.set(p.id, {x: p.x, y: p.y, reward: p.reward, distance: dist, gain: p.reward - dist});
    //         }
    //     }
    // }
    //
    // let options = [];
    //
    // for (const [id, parcel] of db_parcels.entries()) {
    //     if (!parcel.carriedBy) {
    //         let nearest_delivery = nearestDelivery({x: parcel.x, y: parcel.y});
    //         options.push({
    //             instruction: "go_pick_up",
    //             x: parcel.x,
    //             y: parcel.y,
    //             gain: me.carrying + parcel.reward - (me.carrying_size + 1) * PARCEL_DECADING_INTERVAL/MOVEMENT_DURATION * (distance({x: me.x, y: me.y}, {x: parcel.x, y: parcel.y}) + distance({x: parcel.x, y: parcel.y}, {x: nearest_delivery.x, y: nearest_delivery.y}))
    //         })
    //     }
    // }
    // if (me.carrying > 0) {
    //     let nearest_delivery = nearestDelivery(me);
    //     options.push({
    //         instruction: "go_deliver",
    //         x: nearest_delivery.x,
    //         y: nearest_delivery.y,
    //         gain: me.carrying - me.carrying_size * PARCEL_DECADING_INTERVAL/MOVEMENT_DURATION * distance({x: me.x, y: me.y}, {x: nearest_delivery.x, y: nearest_delivery.y})
    //     })
    // }
    //
    // options.sort((o1, o2) => - o1.gain + o2.gain);
    // for (const option of options)
    //     myAgent.push(option);
}

function updateAgents(agents) {
    BeliefSet.updateAgents(agents);
    console.log(BeliefSet.getAgents());

    // if (me.x % 1 != 0 || me.y % 1 != 0) return;
    //
    // // a = { id:string, name:string, x:number, y:number, score:number }
    // for (const a of agents) {
    //     if (a.x % 1 != 0 || a.y % 1 != 0) continue;
    //
    //     myBeliefset.declare("opponent " + a.id);
    //
    //     if (!db_agents.has(a.id)) {
    //         db_agents.set(a.id, a)
    //         myBeliefset.declare("at " + a.id + " " + a.x + "_" + a.y);
    //         myBeliefset.undeclare("available " + a.x + "_" + a.y);
    //     } else {
    //         const a_history = db_agents.get(a.id)
    //
    //         if (a_history.x != a.x || a_history.y != a.y) {
    //             db_agents.delete(a_history.id);
    //             db_agents.set(a.id, a)
    //             myBeliefset.undeclare("at " + a_history.id + " " + a_history.x + "_" + a_history.y);
    //             myBeliefset.declare("at " + a.id + " " + a.x + "_" + a.y);
    //             myBeliefset.declare("available " + a_history.x + "_" + a_history.y);
    //             myBeliefset.undeclare("available " + a.x + "_" + a.y);
    //         }
    //     }
    // }
    //
    // for (const [id, history] of db_agents.entries()) {
    //     if (!agents.map(a => a.id).includes(id)) {
    //         // TODO: decidere cosa vogliamo fare con gli agenti che abbiamo già visto ma
    //         // non sono più nel nostro campo visivo
    //         // per ora li dimentica e assume che la loro posizione sia liberata
    //         db_agents.delete(id);
    //         myBeliefset.undeclare("at " + history.id + " " + history.x + "_" + history.y);
    //         myBeliefset.declare("available " + history.x + "_" + history.y);
    //     }
    // }
}

function initMap(width, height, tiles) {
    BeliefSet.initMap(width, height, tiles);
    console.log("Map initialized!");
    // for (let tile of tiles) {
    //         myBeliefset.declare("tile " + tile.x + "_" + tile.y);
    //         myBeliefset.declare("available " + tile.x + "_" + tile.y);
    //
    //         if (tile.delivery) {
    //             myBeliefset.declare("delivery " + tile.x + "_" + tile.y);
    //         }
    //
    //         let right = tiles.find((_x, _y) => tile.x + 1== _x && tile.y == _y);
    //         let left = tiles.find((_x, _y) => tile.x - 1 == _x && tile.y == _y);
    //         let up = tiles.find((_x, _y) => tile.x == _x && tile.y + 1 == _y);
    //         let down = tiles.find((_x, _y) => tile.x == _x && tile.y - 1 == _y);
    //         if (right)
    //             myBeliefset.declare("right " + x + "_" + y + " " + right.x + "_"  + right.y);
    //         if (left)
    //             myBeliefset.declare("left " + x + '_' + y + " " + left.x + "_" + left.y);
    //         if (up)
    //             myBeliefset.declare("up " + x + "_"  + y + " " + up.x + "_" + up.y);
    //         if (down)
    //             myBeliefset.declare("down " + x + "_" + y + " " + down.x + "_" + down.y);
    //     }
}

function updateMe(me) {
    BeliefSet.updateMe(me.id, me.name, me.x, me.y, me.score);
    console.log(BeliefSet.getMe());
}

export { initMap, updateAgents, updateMe, updateParcels };
