import BeliefSet from "./belief.js";

const TileType = {
    NORMAL: 0,
    DELIVERY: 1,
    EMPTY: 2,
    OBSTACLE: 3,
};

class Tile {
    x;
    y;
    type;

    constructor(x, y, delivery, parcelSpawner, obstacle = false) {
        this.x = x;
        this.y = y;
        this.type = obstacle
            ? TileType.OBSTACLE
            : delivery
              ? TileType.DELIVERY
              : parcelSpawner
                ? TileType.NORMAL
                : TileType.EMPTY;
    }

    equals(tile) {
        return this.x === tile.x && this.y === tile.y;
    }
}

class TileMap {
    width;
    height;
    tiles;

    constructor(width, height, tiles) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width);
        for (let i = 0; i < width; i++) {
            this.tiles[i] = new Array(height);
        }
        tiles.forEach((tile) => {
            this.tiles[tile.x][tile.y] = new Tile(
                tile.x,
                tile.y,
                tile.delivery,
                tile.parcelSpawner,
            );
        });
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                if (this.tiles[i][j] === undefined) {
                    this.tiles[i][j] = new Tile(i, j, false, false, true);
                }
            }
        }
    }

    toPddl() {
        let pddl = new Map();
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                const tile = this.tiles[i][j];
                let currentTile = [];

                currentTile.push(`(tile x${i}y${j})`);

                if (tile.type !== TileType.OBSTACLE) {
                    currentTile.push(`(available x${i}y${j})`);
                } else {
                    currentTile.push(`(not (available x${i}y${j}))`);
                }

                const neighbours = this.getNeighbours(tile);
                neighbours.forEach((neighbour) => {
                    if (neighbour.x > tile.x) {
                        currentTile.push(
                            `(right x${neighbour.x}y${neighbour.y} x${i}y${j})`,
                        );
                    } else if (neighbour.x < tile.x) {
                        currentTile.push(
                            `(left x${neighbour.x}y${neighbour.y} x${i}y${j})`,
                        );
                    } else if (neighbour.y > tile.y) {
                        currentTile.push(
                            `(up x${neighbour.x}y${neighbour.y} x${i}y${j})`,
                        );
                    } else if (neighbour.y < tile.y) {
                        currentTile.push(
                            `(down x${neighbour.x}y${neighbour.y} x${i}y${j})`,
                        );
                    }
                });

                pddl.set(`x${i}y${j}`, currentTile);
            }
        }
        return pddl;
    }

    getTile(x, y) {
        if (x % 1 !== 0) x = Math.round(x);
        if (y % 1 !== 0) y = Math.round(y);
        return this.tiles[x][y];
    }

    getMyPosition() {
        return new Tile(BeliefSet.getMe().last_x, BeliefSet.getMe().last_y);
    }

    getRandomTile() {
        let tile = null;
        let parcelSpawnersTiles = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const tile = this.tiles[x][y];
                if (tile.type === TileType.NORMAL) {
                    parcelSpawnersTiles.push(tile);
                }
            }
        }
        // check if tile in BeliefSet.ignoredTiles
        while (tile === null || BeliefSet.ignoredTiles.includes(tile)) {
            const index = Math.floor(
                Math.random() * parcelSpawnersTiles.length,
            );
            tile = parcelSpawnersTiles[index];
        }
        return tile;
    }

    getDeliverySpots() {
        const deliverySpots = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const tile = this.tiles[x][y];
                let isReachable = BeliefSet.checkTileReachable(tile);
                if (!isReachable) {
                    BeliefSet.ignoredTiles.push({ x: tile.x, y: tile.y });
                } else if (isReachable && tile.type === TileType.DELIVERY) {
                    deliverySpots.push(tile);
                }
            }
        }
        return deliverySpots;
    }

    isDeliverySpot(tile) {
        return tile.type === TileType.DELIVERY;
    }

    getNeighbours(tile) {
        const neighbours = [];
        if (
            tile.x > 0 &&
            this.tiles[tile.x - 1][tile.y].type !== TileType.OBSTACLE &&
            Array.from(BeliefSet.getAgents()).every(
                (agent) =>
                    agent.last_x !== tile.x - 1 || agent.last_y !== tile.y,
            )
        ) {
            neighbours.push(this.tiles[tile.x - 1][tile.y]);
        }
        if (
            tile.x < this.width - 1 &&
            this.tiles[tile.x + 1][tile.y].type !== TileType.OBSTACLE &&
            Array.from(BeliefSet.getAgents()).every(
                (agent) =>
                    agent.last_x !== tile.x + 1 || agent.last_y !== tile.y,
            )
        ) {
            neighbours.push(this.tiles[tile.x + 1][tile.y]);
        }
        if (
            tile.y > 0 &&
            this.tiles[tile.x][tile.y - 1].type !== TileType.OBSTACLE &&
            Array.from(BeliefSet.getAgents()).every(
                (agent) =>
                    agent.last_x !== tile.x || agent.last_y !== tile.y - 1,
            )
        ) {
            neighbours.push(this.tiles[tile.x][tile.y - 1]);
        }
        if (
            tile.y < this.height - 1 &&
            this.tiles[tile.x][tile.y + 1].type !== TileType.OBSTACLE &&
            Array.from(BeliefSet.getAgents()).every(
                (agent) =>
                    agent.last_x !== tile.x || agent.last_y !== tile.y + 1,
            )
        ) {
            neighbours.push(this.tiles[tile.x][tile.y + 1]);
        }
        return neighbours;
    }
}

export { Tile, TileMap, TileType };
