export class WallBlock extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width, height, id) {
        super(scene, x, y, width, height, 0x888888);
        this.id = id;
        this.setDepth(5);
        this.setOrigin(0);
        scene.add.existing(this);
    }
}