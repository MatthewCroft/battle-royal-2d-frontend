export class LocalPlayer extends Phaser.GameObjects.Container {
    constructor(scene, player, treeUUID) {
        super(scene, player.centerX, player.centerY);
        this.treeUUID = treeUUID;
        this.type = "PLAYER";
        this.id = player.id;
        this.health = player.health;
        this.speed = player.speed;
        this.radius = player.radius;
        this.collisionCorrectionTime = 0;

        // Player circle
        this.circle = scene.add.circle(0, 0, player.radius, 0x44ff44);
        this.circle.setFillStyle(0x44ff44, 1);
        this.circle.setVisible(true);

        // Direction pointer (pointing up initially)
        this.pointer = scene.add.line(0, 0, 0, 0, 0, -player.radius - 20, 0xffffff)
            .setOrigin(0, 0)
            .setLineWidth(2);

        // Add to container and scene
        this.add([this.circle, this.pointer]);
        scene.add.existing(this);
    }

    updateFromServer(serverPlayer) {
        const dx = serverPlayer.centerX - this.x;
        const dy = serverPlayer.centerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.x = Phaser.Math.Linear(this.x, serverPlayer.centerX, 0.2);
            this.y = Phaser.Math.Linear(this.y, serverPlayer.centerY, 0.2);
            console.log("player position corrected");
        } else {
            this.x = serverPlayer.centerX;
            this.y = serverPlayer.centerY;
        }

        const angleDiff = Phaser.Math.Angle.Wrap(serverPlayer.angle - this.angle);
        this.angle += angleDiff * 0.1; // interpolation step
        // const pointerDX = serverPlayer.- this.pointerX;
        // const pointerDY = serverPlayer.pointerY - this.pointerY;
        // const pointerDistance = Math.sqrt(pointerDX * pointerDX + pointerDY * pointerDY);
        //
        // if (pointerDistance > 5) {
        //     this.pointerX = Phaser.Math.Linear(this.pointerX, serverPlayer.pointerX, 0.2);
        //     this.pointerY = Phaser.Math.Linear(this.pointerY, serverPlayer.pointerY, 0.2);
        // } else {
        //     this.pointerX = serverPlayer.pointerX;
        //     this.pointerY = serverPlayer.pointerY;
        // }
    }

    updateInput(keys, pointer) {
        if (performance.now() < this.collisionCorrectionTime) return;
        const prevX = this.x;
        const prevY = this.y;
        let currentX = this.x;
        let currentY = this.y;

        // the client player will update when the server responds
        if (keys.W.isDown) currentY = this.y - this.speed;
        if (keys.S.isDown) currentY = this.y + this.speed;
        if (keys.A.isDown) currentX = this.x - this.speed;
        if (keys.D.isDown) currentX = this.x + this.speed;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        const withinBounds = currentX >= 0 && currentX <= 1920 &&
            currentY >= 0 && currentY <= 1080;
        if (withinBounds && (parseInt(currentX) !== parseInt(prevX) || parseInt(currentY) !== parseInt(prevY) ||
            parseFloat(this.angle) !== parseFloat(angle))) {
            this.sendPlayerMoveUpdate(currentX, currentY, angle);
            this.x = currentX;
            this.y = currentY;
            this.angle = angle;
        }

        const length = 60;
        const endX = Math.cos(this.angle) * length;
        const endY = Math.sin(this.angle) * length;
        this.pointer.setTo(0, 0, endX, endY);
    }

    async sendPlayerMoveUpdate(currentX, currentY, angle) {
        const playerObj = {
            id: this.id,
            type: this.type,
            health: this.health,
            speed: this.speed,
            angle,
            centerX: currentX,
            centerY: currentY,
            radius: this.radius
        };

        await fetch(`/api/quadtree/${this.treeUUID}/player`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(playerObj)
        });
    }

    draw() {
        // if (performance.now() < this.collisionCorrectionTime) return;
        // const length = 60;
        // const endX = Math.cos(this.angle) * length;
        // const endY = Math.sin(this.angle) * length;
        //
        // this.setPosition(this.x, this.y);
        // this.pointer.setTo(0, 0, endX, endY); // relative to player center (0, 0 inside the container)
    }
}