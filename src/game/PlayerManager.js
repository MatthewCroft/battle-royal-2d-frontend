export class PlayerManager {
    constructor(player, treeUUID) {
        this.treeUUID = treeUUID;
        this.type = "PLAYER";
        this.id = player.id;
        this.health = player.health;
        this.speed = player.speed;
        this.pointerX = player.pointerX;
        this.pointerY = player.pointerY;
        this.centerX = player.centerX;
        this.centerY = player.centerY;
        this.radius = player.radius;
        this.collisionCorrectionTime = 0;
    }

    updateInput(keys, pointer) {
        if (performance.now() < this.collisionCorrectionTime) return;
        const prevX = this.centerX;
        const prevY = this.centerY;
        let currentX = this.centerX;
        let currentY = this.centerY;
        let currentPointerX;
        let currentPointerY;
        const prevPointerX = this.pointerX;
        const prevPointerY = this.pointerY;

        // the client player will update when the server responds
        if (keys.W.isDown) currentY = this.centerY - this.speed;
        if (keys.S.isDown) currentY = this.centerY + this.speed;
        if (keys.A.isDown) currentX = this.centerX - this.speed;
        if (keys.D.isDown) currentX = this.centerX + this.speed;

        const angle = Phaser.Math.Angle.Between(this.centerX, this.centerY, pointer.worldX, pointer.worldY);
        currentPointerX = this.centerX + Math.cos(angle) * 45;
        currentPointerY = this.centerY + Math.sin(angle) * 45;
        const withinBounds = currentX >= 0 && currentX <= 1920 &&
            currentY >= 0 && currentY <= 1080;
        if (withinBounds && (parseInt(currentX) !== parseInt(prevX) || parseInt(currentY) !== parseInt(prevY) ||
            parseInt(prevPointerY) !== parseInt(currentPointerY) || parseInt(prevPointerX) !== parseInt(currentPointerX))) {
            this.sendPlayerMoveUpdate(currentX, currentY,
                currentPointerX, currentPointerY);
            this.centerX = currentX;
            this.centerY = currentY;
            this.pointerY = currentPointerY;
            this.pointerX = currentPointerX;
        }
    }

    async sendPlayerMoveUpdate(currentX, currentY, pointerX, pointerY) {
        const playerObj = {
            id: this.id,
            type: this.type,
            health: this.health,
            speed: this.speed,
            pointerX: pointerX,
            pointerY: pointerY,
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

    updateFromServer(serverPlayer) {
        const dx = serverPlayer.centerX - this.centerX;
        const dy = serverPlayer.centerY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.centerX = Phaser.Math.Linear(this.centerX, serverPlayer.centerX, 0.2);
            this.centerY = Phaser.Math.Linear(this.centerY, serverPlayer.centerY, 0.2);
        } else {
            this.centerX = serverPlayer.centerX;
            this.centerY = serverPlayer.centerY;
        }

        const pointerDX = serverPlayer.pointerX - this.pointerX;
        const pointerDY = serverPlayer.pointerY - this.pointerY;
        const pointerDistance = Math.sqrt(pointerDX * pointerDX + pointerDY * pointerDY);

        if (pointerDistance > 5) {
            this.pointerX = Phaser.Math.Linear(this.pointerX, serverPlayer.pointerX, 0.2);
            this.pointerY = Phaser.Math.Linear(this.pointerY, serverPlayer.pointerY, 0.2);
        } else {
            this.pointerX = serverPlayer.pointerX;
            this.pointerY = serverPlayer.pointerY;
        }
    }



    draw(graphics) {
        graphics.fillStyle(0x44ff44);
        graphics.fillCircle(this.centerX, this.centerY, this.radius);

        // Draw direction line
        graphics.lineStyle(2, 0xffffff);
        graphics.beginPath();
        graphics.moveTo(this.centerX, this.centerY);
        graphics.lineTo(this.pointerX, this.pointerY);
        graphics.strokePath();
    }
}