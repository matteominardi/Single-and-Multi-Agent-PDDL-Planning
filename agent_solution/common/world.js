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

    constructor(x, y, delivery, parcelSpawner) {
        this.x = x;
        this.y = y;
        this.type = delivery
            ? TileType.DELIVERY
            : parcelSpawner
              ? TileType.NORMAL
              : TileType.EMPTY;
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
    }
}

export { TileMap, TileType, Tile };
