
const TileType = {
    NORMAL: 0,
    DELIVERY: 1,
}

class Tile {
    /**
     * x position of the tile
     * @param {number} x
     */
    x
    /**
     * y position of the tile
     * @param {number} y
     */
    y
    /**
     * type of the tile
     * @param {TileType} type
     */
    type
    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} delivery
     */
    constructor(x, y, delivery) {
        this.x = x
        this.y = y
        this.type = delivery ? TileType.DELIVERY : TileType.NORMAL
    }

}

class Tiles extends Array {
    /**
     * @param {...Tile} tiles
     */
    constructor(...tiles) {
        super(...tiles)
    }
}

class TileMap {

/**
     * width of the map
     * @param {number} width
     */
    width
    /**
     * height of the map
     * @param {number} height
     */
    height
    /**
     * tiles of the map
     * @param {Tile[][]} tiles
     */
    tiles

    /**
     * @param width {number} width of the map
     * @param height {number} height of the map
     * @param tiles {Array} tiles of the map
     */
    constructor(width, height, tiles) {
        this.width = width
        this.height = height
        this.tiles = new Array(width)
        for (let i = 0; i < width; i++) {
            this.tiles[i] = new Array(height)
        }
        tiles.forEach(tile => {
            this.tiles[tile.x][tile.y] = new Tile(tile.x, tile.y, tile.delivery)
        })
        // for (let i = 0; i < width; i++) {
        //     for (let j = 0; j < height; j++) {
        //         if (!this.tiles[i][j]) {
        //             process.stdout.write('.')
        //         } else if (this.tiles[i][j].type === TileType.NORMAL) {
        //             process.stdout.write('N')
        //         } else {
        //             process.stdout.write('D')
        //         }
        //
        //     }
        //     console.log()
        // }
    }
}

export {TileMap, TileType, Tile, Tiles}