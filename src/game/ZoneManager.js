export class ZoneManager extends Phaser.GameObjects.Container {
    constructor(scene, x, y, radius) {
        super(scene, x, y);

        this.scene = scene;
        this.radius = radius;
        this.zoneTime = 0;
        this.lastTickSound = 0;

        this.baseCircle = scene.add.circle(0, 0, radius, 0x000000);
        this.baseCircle.setStrokeStyle(2, 0xffffff);

        this.progressArc = scene.add.graphics();
        this.progressArc.setDepth(1);

        this.add([this.baseCircle, this.progressArc]);

        scene.add.existing(this);
    }

    updateFromServer(data) {
        this.zoneTime = data.time;
    }

    preUpdate() {
        this.progressArc.clear();
        const progress = Phaser.Math.Clamp(this.zoneTime / 10, 0, 1);

        if (progress > 0) {
            if (performance.now() - this.lastTickSound > 1000) {
                this.scene.feedbackManager.zoneTick(); // plays tick sound
                this.lastTickSound = performance.now();
            }

            this.progressArc.lineStyle(4, 0x00ff00);
            this.progressArc.beginPath();
            this.progressArc.arc(
                0, 0, this.radius,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * progress,
                false
            );
            this.progressArc.strokePath();
        }
    }
}