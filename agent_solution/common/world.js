import Belief from "./belief.js";
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
    gain;

    constructor(x, y, delivery, parcelSpawner) {
        this.x = x;
        this.y = y;
        this.type = delivery
            ? TileType.DELIVERY
            : parcelSpawner
              ? TileType.NORMAL
              : TileType.EMPTY;
        this.gain = 0;
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
                    this.tiles[i][j] = new Tile(i, j, false, false);
                }
            }
        }
    }

    getTile(x, y) {
        if (x % 1 !== 0) x = Math.round(x);
        if (y % 1 !== 0) y = Math.round(y);
        return this.tiles[x][y];
    }

    getMyPosition() {
        return new Tile(BeliefSet.getMe().last_x, BeliefSet.getMe().last_y);
    }

    getDeliverySpots() {
        const deliverySpots = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const tile = this.tiles[x][y];
                if (tile.type === TileType.DELIVERY) {
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
            this.tiles[tile.x - 1][tile.y].type !== TileType.EMPTY
        ) {
            neighbours.push(this.tiles[tile.x - 1][tile.y]);
        }
        if (
            tile.x < this.width - 1 &&
            this.tiles[tile.x + 1][tile.y].type !== TileType.EMPTY
        ) {
            neighbours.push(this.tiles[tile.x + 1][tile.y]);
        }
        if (
            tile.y > 0 &&
            this.tiles[tile.x][tile.y - 1].type !== TileType.EMPTY
        ) {
            neighbours.push(this.tiles[tile.x][tile.y - 1]);
        }
        if (
            tile.y < this.height - 1 &&
            this.tiles[tile.x][tile.y + 1].type !== TileType.EMPTY
        ) {
            neighbours.push(this.tiles[tile.x][tile.y + 1]);
        }
        return neighbours;
    }
}

export { TileMap, TileType, Tile };
