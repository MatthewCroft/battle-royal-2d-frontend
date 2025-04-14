export class UIButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, label, onClick) {
        super(scene, x, y);
        this.scene = scene;
        this.width = width;
        this.height = height;

        this.background = scene.add.rectangle(0, 0, width, height, 0xeeeeee)
            .setOrigin(.5)
            .setInteractive({ useHandCursor: true });

        this.text = scene.add.text(0, 0, label, {
            fontSize: '32px',
            color: '#000000',
            fontFamily: 'Arial'
        }).setOrigin(.5);

        this.add([this.background, this.text]);

        this.background.on('pointerdown', () => {
            onClick?.();
        });

        this.background.on('pointerover', () => {
            this.background.setFillStyle(0xcccccc);
        });

        this.background.on('pointerout', () => {
            this.background.setFillStyle(0xeeeeee);
        });

        scene.add.existing(this);
    }
}