export default class Atrium extends Phaser.Scene {

    constructor() {
        super("Atrium")
    }

    preload ()
    {
        // Add the Sprite for player here
        this.fauna = Phaser.Physics.Arcade.Sprite
        // Controls must be added inside here
        this.cursors = this.input.keyboard.createCursorKeys()

        // Make it so that client can reference here, stupid code but works
        screen.client.setGameScene(this.game)

        this.portalJSON = this.returnPortalJSON()
    }

    create ()
    {
        // ## PLAYER ##
        // The sprite
        this.fauna = this.physics.add.sprite(600, 1200, 'fauna', 'walk-down-3.png')
        this.fauna.body.setSize(this.fauna.width * 0.5, this.fauna.height * 0.8)
        // Add the animation
        this.createPlayerAnimations()

        this.currentMap = this.loadMap('atriumSample1', 'atriumSampleTiles')


        // // ## LOAD MAP ##
        // // Create the tilemap
        // const map = this.make.tilemap({key: 'atriumSample1'})
        // // Add image to it
        // const tileset = map.addTilesetImage('atriumSample1', 'atriumSampleTiles')
        // // Create the normal static layers
        // map.createStaticLayer('ground', tileset)
        // map.createStaticLayer('darktiles', tileset)
        // map.createStaticLayer('escalator', tileset)
        // // Add colliding layers
        // map.layers.forEach(item => console.log(item))
        // console.log(map.layers)
        // const barrierLayer = map.createStaticLayer('barrier', tileset)
        // const railLayer = map.createStaticLayer('rail', tileset)
        // const treesLayer = map.createStaticLayer('trees', tileset)
        // const itemsLayer = map.createStaticLayer('items', tileset)
        // const collidingObjects = [barrierLayer, railLayer, treesLayer, itemsLayer]

        // // Make the map
        // const map = this.make.tilemap({ key: 'dungeon'});
        // const tileset = map.addTilesetImage('dungeon', 'tiles');
        //
        // // Load the map layer
        // map.createStaticLayer('ground', tileset);
        // const wallLayer = map.createStaticLayer('wall', tileset);
        //
        // // So that user collides to the wall
        // wallLayer.setCollisionByProperty({collide: true});
        // ## ADD OBJECTS ##
        // this.portalVert = this.physics.add.image(400, 500, 'portalVert').setImmovable()
        // this.portalVert.setScale(5, 5)
        // add the portal object






        // Start playing the animations
        this.fauna.anims.play('fauna-idle-up')



        // ## COLLIDERS ##
        // collidingObjects.forEach(object => {
        //     object.setCollisionByProperty({collide: true});
        //     this.physics.add.collider(this.fauna, object)
        // } )
        // // Set collider so that wall and player collides
        // this.physics.add.collider(this.fauna, wallLayer)

        // this.physics.add.collider(this.fauna, this.portalVert)




        // Make the camera follow the player
        this.cameras.main.startFollow(this.fauna, true)

        // The map have no players yet
        this.playerMap = {}

        // Start the updateCounter to 0 to make the client send something to the server every sometime
        this.updateCounter = 0
        // Set a last coord for client to know if its location changed since update
        this.lastCoord = {x: 0, y: 0}

        // Done everything else, now can ask for other players
        screen.client.askNewPlayer()

        this.fauna.setDepth(1)
        // map.removeAllLayers()
    }


    loadMap (mapName, tileName) {
        const map = this.make.tilemap({key: mapName})
        const tileset = map.addTilesetImage(mapName, tileName)
        map.colliders = []
        map.layers.forEach(layer => {
            // console.log(layer.name)
            var tempLayer = map.createStaticLayer(layer.name, tileset)
            tempLayer.setCollisionByProperty({collide: true})
            var tempCollider = this.physics.add.collider(this.fauna, tempLayer)
            map.colliders.push(tempCollider)
        })
        this.addAllPortals(this.portalJSON, mapName)
        return map
    }



    addAllPortals (result, mapName) {
        console.log('result', result)
        console.log('mapName', mapName)
        this.portalArray = []
        result[mapName].forEach(portal => {
            var tempPortal = this.addPortal(portal.x, portal.y, portal.map, portal.tileset, portal.vert, portal.tpX, portal.tpY, mapName)
            this.portalArray.push(tempPortal)
        })

    }

    addPortal (x, y, map, tileset, vert, tpX, tpY, mapName) {
        console.log(x, y, map, tileset, vert, tpX, tpY)
        if (vert) {
            var portal = this.physics.add.image(x, y, 'portalVert').setImmovable()
        } else {
            var portal = this.physics.add.image(x, y, 'portalHorz').setImmovable()
        }
        var collider = this.physics.add.collider(this.fauna, portal, this.hitPortal, null, this)
        portal.setScale(5, 5)
        portal.oldMap = mapName
        portal.targetMap = map
        portal.targetTileset = tileset
        portal.tpX = tpX
        portal.tpY = tpY
        portal.collider = collider
        return portal
    }


    createPlayerAnimations () {
        this.anims.create({
            key: 'fauna-idle-down',
            frames: [{ key: 'fauna', frame: 'walk-down-3.png'}]
        })
        this.anims.create({
            key: 'fauna-idle-up',
            frames: [{ key: 'fauna', frame: 'walk-up-3.png'}]
        })
        this.anims.create({
            key: 'fauna-idle-side',
            frames: [{ key: 'fauna', frame: 'walk-side-3.png'}]
        })
        this.anims.create({
            key: 'fauna-run-down',
            frames: this.anims.generateFrameNames('fauna', { start: 1, end: 8, prefix: 'run-down-', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        })
        this.anims.create({
            key: 'fauna-run-up',
            frames: this.anims.generateFrameNames('fauna', { start: 1, end: 8, prefix: 'run-up-', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        })
        this.anims.create({
            key: 'fauna-run-side',
            frames: this.anims.generateFrameNames('fauna', { start: 1, end: 8, prefix: 'run-side-', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        })
    }

    hitPortal (fauna, portal) {
        console.log('portal', portal)

        this.currentMap.colliders.forEach(collider => collider.destroy())
        this.portalArray.forEach(portal => portal.collider.destroy())
        // // this.testCollider.destroy()
        // // portalHorz.disableBody(true, true);
        var oldMap = portal.oldMap
        var map = portal.targetMap
        var tileset = portal.targetTileset
        var x = portal.tpX
        var y = portal.tpY
        portal.destroy()
        this.currentMap.destroy()
        this.currentMap = this.loadMap(map, tileset)
        this.fauna.setPosition(x, y)
        screen.client.changeMap(map, oldMap)

    }

    // Add new players from the object from server
    addNewPlayer (id, x, y) {
        this.playerMap[id] = this.add.sprite(x, y, 'fauna', 'walk-down-3.png')
    }

    // Move players from client from server
    movePlayer (id, x, y) {
        // console.log("movePlayer", id, x, y)
        // Find the player from player map
        var player = this.playerMap[id]
        if (player == undefined) return
        // console.log(player)
        // console.log(player)
        // var distance = Phaser.Math.Distance.Between(player.x,player.y,x,y);

        // Set up the config for tween
        var config = {
            targets: player,
            x: x,
            y: y,
            duration: 170 //todo
        }

        // Tween the player to the new place
        var tween = this.tweens.add(config)
        // var tween = this.add.tween(config).to({x:x,y:y})
        // var duration = 0.2//distance*10;
        // tween.start();
    }

    // Remove players when server tell us to
    removePlayer (id) {
        this.playerMap[id].destroy();
        delete this.playerMap[id];
    }

    removeAllPlayers () {
        for (var key in this.playerMap) {
            this.removePlayer(key)
        }
        console.log("removed all players")
    }

    update()
    {
        // If no curser or no fauna, we don't update
        if (!this.cursors || !this.fauna) {
            return
        }

        // The stupid code that limites the data transfer rate
        if (this.updateCounter++ % 5 === 0) { //todo
            // Send the location integer only when there is change
            if (this.lastCoord.x != Math.floor(this.fauna.x) || this.lastCoord.y != Math.floor(this.fauna.y)) {
                screen.client.sendLocation(Math.floor(this.fauna.x), Math.floor(this.fauna.y))
                this.lastCoord.x = Math.floor(this.fauna.x)
                this.lastCoord.y = Math.floor(this.fauna.y)
                // console.log('update location')
            }
        }


        // The code to make moveing work
        const speed = 100

        if (this.cursors.left?.isDown) {
            this.fauna.anims.play('fauna-run-side', true)
            this.fauna.setVelocity(-speed, 0)

            this.fauna.scaleX = -1
            this.fauna.body.offset.x = 24
        } else if (this.cursors.right?.isDown) {
            this.fauna.anims.play('fauna-run-side', true)
            this.fauna.setVelocity(speed, 0)

            this.fauna.scaleX = 1
            this.fauna.body.offset.x = 8
        } else if (this.cursors.up?.isDown) {
            this.fauna.anims.play('fauna-run-up', true)
            this.fauna.setVelocity(0, -speed)
        } else if (this.cursors.down?.isDown) {
            this.fauna.anims.play('fauna-run-down', true)
            this.fauna.setVelocity(0, speed)
        } else {
            const parts = this.fauna.anims.currentAnim.key.split('-')
            parts[1] = 'idle'
            this.fauna.play(parts.join('-'))
            this.fauna.setVelocity(0, 0)
        }

    }

    returnPortalJSON () {
        return{
            "atriumSample1": [
                {
                    "x": 700,
                    "y": 1050,
                    "map": "dungeon",
                    "tileset": "tiles",
                    "vert": false,
                    "tpX": 100,
                    "tpY": 100
                }
            ],
            "dungeon": [
                {
                    "x": 50,
                    "y": 50,
                    "map": "atriumSample1",
                    "tileset": "atriumSampleTiles",
                    "vert": true,
                    "tpX": 600,
                    "tpY": 1100
                }
            ]
        }
    }
}