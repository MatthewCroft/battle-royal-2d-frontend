export class EnemyPlayer extends Phaser.GameObjects.Container {
    constructor(scene, player) {
        super(scene, player.centerX, player.centerY);
        this.type = "PLAYER";
        this.id = player.id;
        this.health = player.health;
        this.speed = player.speed;
        this.radius = player.radius;

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

    drawEnemy(updatedEnemy) {
        const length = 60;
        this.angle = updatedEnemy.angle;
        const endX = Math.cos(this.angle) * length;
        const endY = Math.sin(this.angle) * length;

        this.pointer.setTo(0, 0, endX, endY);
        this.x = updatedEnemy.centerX;
        this.y = updatedEnemy.centerY;
    }
}