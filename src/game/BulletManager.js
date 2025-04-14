export class BulletManager {
    constructor(scene, treeUUID) {
        this.scene = scene;
        this.speed = 6;
        this.radius = 7;
        this.treeUUID = treeUUID;

        this.bullets = new Map();
        this.pendingDeletes = new Set();
        this.bulletsToDespawn = [];

        this.bulletPool = this.scene.add.group({
            classType: Phaser.GameObjects.Arc,
            maxSize: 100,
            runChildUpdate: false
        });
    }

    async fireBullet(x, y, angle, bulletId, playerId) {
        const offset = 50;
        const bulletX = x + Math.cos(angle) * offset;
        const bulletY = y + Math.sin(angle) * offset;

        const bullet = this.bulletPool.get();
        if (!bullet) return;
        if (!bullet.scene) {
            this.scene.add.existing(bullet);
        }

        bullet.setActive(true)
            .setVisible(true)
            .setAlpha(1)
            .setPosition(bulletX, bulletY)
            .setFillStyle(0xffff00, 1)
            .setRadius(this.radius);

        bullet.velocityX = Math.cos(angle) * this.speed;
        bullet.velocityY = Math.sin(angle) * this.speed;
        bullet.targetX = null;
        bullet.targetY = null;
        bullet.playerId = playerId;
        bullet.id = bulletId;

        this.bullets.set(bulletId, bullet);

        await fetch(`/api/quadtree/${this.treeUUID}/bullet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "BULLET",
                angle,
                id: bulletId,
                centerX: bulletX,
                centerY: bulletY,
                radius: this.radius,
                velocityX: bullet.velocityX,
                velocityY: bullet.velocityY,
                player: playerId
            })
        });
    }

    update(barriers, opponents) {
        for (let bullet of this.bullets.values()) {
            if (this.pendingDeletes.has(bullet.id)) {
                this.despawn(bullet.id, bullet);
                continue;
            }

            //todo: update so that server can respawn bullets if intersecting from phaser does not agree with server
            const bulletCircle = new Phaser.Geom.Circle(bullet.x, bullet.y, bullet.radius);

            for (const barrier of barriers.values()) {
                if (Phaser.Geom.Intersects.CircleToRectangle(bulletCircle, barrier)) {
                    this.despawn(bullet.id, bullet);
                    break;
                }
            }

            for (const opponent of opponents.values()) {
                if (Phaser.Geom.Intersects.CircleToCircle(bulletCircle, opponent)) {
                    this.despawn(bullet.id, bullet);
                    break;
                }
            }

            if (!this.bullets.has(bullet.id)) continue;

            const nX = bullet.x + bullet.velocityX;
            const nY = bullet.y + bullet.velocityY;

            if (bullet.targetX !== null && bullet.targetY !== null
                && this.distance(bullet.targetX, nX, bullet.targetY, nY) > 5) {
                bullet.setPosition(Phaser.Math.Linear(nX, bullet.targetX, 0.1),
                    Phaser.Math.Linear(nY, bullet.targetY, 0.1));
                continue;
            }

            bullet.setPosition(nX, nY);
        }
    }

    distance(targetX, x, targetY, y) {
        const dx = targetX - x;
        const dy = targetY - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    despawn(id, bullet) {
        this.bulletsToDespawn.push({ id, bullet });
    }
// Then at the end of `update()`:
    cleanup() {
        for (const { id, bullet } of this.bulletsToDespawn) {
            bullet.setVisible(false);
            bullet.setActive(false);
            bullet.setAlpha(0);
            bullet.targetX = null;
            bullet.targetY = null;
            this.bulletPool.killAndHide(bullet);
            this.bullets.delete(id);
        }
        this.bulletsToDespawn.length = 0; // clear list
    }
}