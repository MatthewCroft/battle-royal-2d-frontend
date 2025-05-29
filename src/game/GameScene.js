import {BulletManager} from "./BulletManager.js";
import {LocalPlayer} from "./LocalPlayer.js";
import {EnemyManager} from "./EnemyManager.js";
import {FeedbackManager} from "../components/FeedbackManager.js";
import {ZoneManager} from "./ZoneManager.js";
import {WallBlock} from "./WallBlock.js";
import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';
import {GameEventRouter} from "../components/GameEventRouter.js";
import {WebSocketClientInstance} from "../components/WebSocketClient.js";

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
        this.wallTreeData = null;
        this.playerManager = null;
        this.enemyManager = null;
        this.bulletManager = null;
        this.zoneManager = new ZoneManager(this, 960, 540, 175);
        this.feedbackManager = new FeedbackManager(this);
        this.router = new GameEventRouter(this, this.uuid);
        WebSocketClientInstance.connect(this.uuid);
        this.isReady = false;
        this.barriers = new Map();
        this.opponents = new Map();
        this.wallblocks = new Map();
        const token = localStorage.getItem("token");

        fetch(`http://localhost:8080/api/quadtree?uuid=${this.uuid}`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(opponent)
            })

            await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/start`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(player)
            }).then(async () => {
                //todo: gather walls and create wallBlocks / barriers
                const response = await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/wall`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                const treeData = await response.json();
                this.wallTreeData = treeData;
                for (let obj of treeData) {
                    if (!obj) continue;
                    if (obj.type === "WALL" && !this.wallblocks.has(obj.id)) {
                        const wallBounds = new Phaser.Geom.Rectangle(obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height);
                        this.barriers.set(obj.id, wallBounds);
                        this.wallblocks.set(obj.id, new WallBlock(this, obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height, obj.id));
                    }
                }

                this.playerManager = new LocalPlayer(this, player, this.uuid)
                this.bulletManager = new BulletManager(this, this.uuid);
                this.enemyManager = new EnemyManager(this, opponent);
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

        //setInterval(() => this.syncPlayersServer(this), 50);
    }

    // async syncPlayersServer() {
    //     const response = await fetch(`http://localhost:8080/api/quadtree/${this.uuid}/player`)
    //     const treeData = await response.json();
    //     this.playerTreeData = treeData;
    //     const serverPlayer = treeData.find(object => object && object.id === this.playerManager.id)
    //     if (serverPlayer) {
    //         this.playerManager.updateFromServer(serverPlayer);
    //     }
    // }

    update() {
        if (!this.isReady) return;
        this.playerManager.updateInput(this.keys, this.pointer);

        this.graphics.clear();

        this.bulletManager.update(this.barriers, this.opponents);
        this.bulletManager.cleanup();
    }

    // drawPlayerTree(g, tree) {
    //     for (let obj of tree) {
    //         if (!obj) continue;
    //         if (obj.type === "PLAYER" && obj.id === this.playerManager.id) {
    //             continue;
    //         }
    //         // todo: draw player with health updates
    //         if (obj.type === "PLAYER") {
    //             const playerCircle = new Phaser.Geom.Circle(obj.centerX, obj.centerY, obj.radius);
    //             this.opponents.set(obj.id, playerCircle);
    //             this.enemyManager.drawEnemy(obj);
    //         }
    //     }
    // }
}