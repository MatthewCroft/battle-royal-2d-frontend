import {BulletManager} from "./BulletManager.js";
import {LocalPlayer} from "./LocalPlayer.js";
import {EnemyPlayer} from "./EnemyPlayer.js";
import {FeedbackManager} from "../components/FeedbackManager.js";
import {ZoneManager} from "./ZoneManager.js";
import {WallBlock} from "./WallBlock.js";
import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameScene'});
        this.lineLength = 30;
        this.uuid = self.crypto.randomUUID();
        this.pendingBulletDeletes = new Set();
        this.keys = null;
        this.pointer = null;
    }

    preload() {
        this.load.audio('hit', '/assets/enemydamage.wav');
        this.load.audio('damage', '/assets/localplayerdamage.wav');
        this.load.audio('players-collision', '/assets/playerplayercollision.wav');
        this.load.audio('wall-collision', '/assets/playerwallcollision.wav');
        this.load.audio('shot', '/assets/shot.wav');
        this.load.audio('zone', '/assets/beepingzone.wav');
    }

    //todo: update so that we are using uuid's for querying the correct game instance
    create() {
        this.graphics = this.add.graphics();
        this.playerTreeData = null;
        this.bulletTreeData = null;
        this.wallTreeData = null;
        this.playerManager = null;
        this.enemyManager = null;
        this.bulletManager = null;
        this.zoneManager = new ZoneManager(this, 960, 540, 175);
        this.feedbackManager = new FeedbackManager(this);
        this.isReady = false;
        this.barriers = new Map();
        this.opponents = new Map();
        this.wallblocks = new Map();

        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            debug: str => console.log('[STOMP]', str),
            reconnectDelay: 5000
        });


        stompClient.onConnect = () => {
            stompClient.subscribe(`/topic/${this.uuid}`, (message) => {
                const data = JSON.parse(message.body);
                if (data.type === "bullet_expired" && this.bulletManager.bullets.has(data.id)) {
                    this.bulletManager.pendingDeletes.add(data.id);
                }

                // play sound
                if (data.type === "player_hit" && data.victim === this.playerManager.id) {
                    this.feedbackManager.localPlayerDamage(this.playerManager);
                }

                if (data.type === "player_hit" && data.victim === this.enemyManager.id) {
                    this.feedbackManager.enemyPlayerDamage(this.enemyManager);
                }

                if (data.type === "player_collision") {
                    this.playerManager.collisionCorrectionTime = performance.now() + 75;
                    this.feedbackManager.playersCollision(data);
                }

                if (data.type === "out_of_bounds" || data.type === "wall_collision") {
                    this.playerManager.collisionCorrectionTime = performance.now() + 75;
                    this.feedbackManager.wallCollision(data);
                }
            });
        };

        fetch(`http://localhost:8080/api/quadtree?uuid=${this.uuid}`, {
            method: "POST"
        }).then(async () =>
            await fetch(`http://localhost:8080/api/quadtree/${this.uuid}`))
            .then(res => res.json())
            .then(data => {
                this.treeData = data;
            }).then(async () => {
            const player = {
                type: "PLAYER",
                id: "matt",
                health: 100.0,
                speed: 4.0,
                centerX: 128.0,
                centerY: 1026.0,
                radius: 40.0
            };
            const opponent = {
                type: "PLAYER",
                id: "opponent",
                health: 100.0,
                speed: 2.0,
                centerX: 50.0,
                centerY: 50.0,
                radius: 40.0,
            }

            await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/start`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(opponent)
            })

            await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/start`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(player)
            }).then(() => {
                this.playerManager = new LocalPlayer(this, player, this.uuid)
                this.bulletManager = new BulletManager(this, this.uuid);
                this.enemyManager = new EnemyPlayer(this, opponent);
                console.log("setup complete")
                this.isReady = true;
            })
        });

        this.input.on("pointerdown", () => {
            const angle = Phaser.Math.Angle.Between(
                this.playerManager.x, this.playerManager.y,
                this.pointer.worldX, this.pointer.worldY
            );
            this.bulletManager.fireBullet(this.playerManager.x, this.playerManager.y, angle, self.crypto.randomUUID(), this.playerManager.id);
            this.feedbackManager.shootBullet();
        })

        // draw game board boundary (same as QuadTree visualizer size)
        this.graphics.lineStyle(2, 0x007acc);
        this.graphics.strokeRect(0, 0, 600, 600);

        // input keys
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        // this.input.on("pointermove", async (pointer) => movePlayerPointer(pointer));
        this.pointer = this.input.activePointer;

        setInterval(() => this.syncPlayersServer(this), 50);
        setInterval(() => this.syncWallServer(this), 50);
        setInterval(() => this.syncBulletServer(this), 50);
        stompClient.activate();
    }

    async syncPlayersServer() {
        const response = await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/player`)
        const treeData = await response.json();
        this.playerTreeData = treeData;
        const serverPlayer = treeData.find(object => object && object.id === this.playerManager.id)
        if (serverPlayer) {
            this.playerManager.updateFromServer(serverPlayer);
        }
    }

    async syncBulletServer() {
        const response = await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/bullet`)
        const treeData = await response.json();
        this.bulletTreeData = treeData;
    }

    async syncWallServer() {
        const response = await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/wall`)
        const treeData = await response.json();
        this.wallTreeData = treeData;
    }

    update() {
        if (!this.isReady) return;
        this.playerManager.updateInput(this.keys, this.pointer);

        // Redraw player and line
        this.graphics.clear();

        if (this.playerTreeData) {
            this.drawPlayerTree(this.graphics, this.playerTreeData);
        }

        if (this.bulletTreeData) {
            this.drawBulletTree(this.graphics, this.bulletTreeData);
        }

        if (this.wallTreeData) {
            this.drawWallTree(this.graphics, this.wallTreeData, this);
        }

        this.bulletManager.update(this.barriers, this.opponents);
        this.bulletManager.cleanup();
    }

    drawPlayerTree(g, tree) {
        for (let obj of tree) {
            if (!obj) continue;
            if (obj.type === "PLAYER" && obj.id === this.playerManager.id) {
                continue;
            }
            // todo: draw player with health updates
            if (obj.type === "PLAYER") {
                const playerCircle = new Phaser.Geom.Circle(obj.centerX, obj.centerY, obj.radius);
                this.opponents.set(obj.id, playerCircle);
                this.enemyManager.drawEnemy(obj);
            }
        }
    }

    drawWallTree(g, tree, scene) {
        for (let obj of tree) {
            if (!obj) continue;
            if (obj.type === "ZONE") {
                scene.zoneManager.updateFromServer(obj);
            }

            if (obj.type === "WALL" && !scene.wallblocks.has(obj.id)) {
                const wallBounds = new Phaser.Geom.Rectangle(obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height);
                this.barriers.set(obj.id, wallBounds);
                scene.wallblocks.set(obj.id, new WallBlock(scene, obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height, obj.id));
            }
        }
    }

    //todo: update to draw each tree (player, wall, bullet)
    drawBulletTree(g, tree) {
        for (let obj of tree) {
            if (!obj) continue;
            // existing bullet set targetX and targetY, signifies the server position of the bullet
            if (obj.type === "BULLET" && this.bulletManager.bullets.has(obj.id) && !this.bulletManager.pendingDeletes.has(obj.id)) {
                let bullet = this.bulletManager.bullets.get(obj.id);
                bullet.targetX = obj.centerX;
                bullet.targetY = obj.centerY;
            }

            // new bullet
            if (obj.type === "BULLET" && !this.bulletManager.bullets.has(obj.id)) {
                const bullet = this.bulletManager.bulletPool.get();
                if (!bullet) return;

                bullet.setActive(true)
                    .setVisible(true)
                    .setPosition(obj.centerX, obj.centerY)
                    .setFillStyle(0xffff00)
                    .setRadius(obj.radius);

                bullet.velocityX = Math.cos(obj.angle) * obj.speed;
                bullet.velocityY = Math.sin(obj.angle) * obj.speed;
                bullet.targetX = null;
                bullet.targetY = null;
                bullet.playerId = obj.player;

                this.bulletManager.bullets.set(obj.id, bullet);
            }
        }
    }

    drawZone(zone, g, scene) {
        g.lineStyle(2, 0xffffff); // thickness = 2, color = white
        g.strokeCircle(zone.centerX, zone.centerY, zone.radius);
        const progress = zone.time / 10;

        if (progress > 0) {
            scene.feedbackManager.zoneTick();
        }

        g.lineStyle(4, 0x00ff00);
        g.beginPath();
        g.arc(zone.centerX, zone.centerY, zone.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
        g.strokePath();
    }

    drawWall(wall, g) {
        const {x, y, width, height} = wall.bounds;

        g.fillStyle(0x888888); // grey fill color
        g.fillRect(x, y, width, height); // draw the wall
    }
}